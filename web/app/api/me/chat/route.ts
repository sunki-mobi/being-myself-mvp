import { google } from "@ai-sdk/google";
import { generateText, Output, type ModelMessage } from "ai";
import { z } from "zod";
import {
  PACEMAKER_SYSTEM_PROMPT,
  buildContextHeader,
} from "@/lib/ai/pacemaker-prompt";
import { classifyGeminiError } from "@/lib/ai/error-helpers";
import { summarizeBaseline } from "@/lib/me/baseline-report";
import { getBaseline, isBaselineId } from "@/lib/me/baselines";
import {
  type BaselineShape,
  summarizeBaselineShape,
} from "@/lib/me/baseline-shape";
import {
  filterUnused,
  scoreQuestion,
  QUESTION_POOL,
  CATEGORY_NAMES,
  RECENT_DEDUP_WINDOW,
  type Question,
} from "@/lib/me/question-pool";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * 최근 누적 qa_pair → Q1 깊이 자료 컨텍스트 텍스트. 최대 8개.
 */
function formatRecentAnswers(
  rows: Array<{
    question_text: string;
    answer_text: string;
    created_at: string;
  }>,
): string | undefined {
  if (rows.length === 0) return undefined;
  const lines: string[] = [
    "[최근 누적 답변 — 최신순. Q1에서 한 표현을 자연스럽게 환기 가능]",
  ];
  for (const r of rows.slice(0, 8)) {
    const kstDate = new Date(r.created_at).toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
    lines.push(`[${kstDate}] Q: ${r.question_text}`);
    lines.push(`         A: ${r.answer_text}`);
  }
  return lines.join("\n");
}

/**
 * 최근 소명일기 entry → Q1 깊이 자료 컨텍스트 텍스트. 최대 4개.
 */
function formatRecentDiary(
  rows: Array<{
    entry_date: string;
    answer: string | null;
    free_note: string | null;
  }>,
): string | undefined {
  const entries = rows
    .filter((r) => r.answer || r.free_note)
    .slice(0, 4);
  if (entries.length === 0) return undefined;
  const lines: string[] = [
    "[최근 소명일기 — 최신순. Q1에서 자연스럽게 환기 가능]",
  ];
  for (const r of entries) {
    const parts: string[] = [];
    if (r.answer) parts.push(`답: ${r.answer.slice(0, 200)}`);
    if (r.free_note) parts.push(`자유: ${r.free_note.slice(0, 200)}`);
    lines.push(`[${r.entry_date}] ${parts.join(" / ")}`);
  }
  return lines.join("\n");
}

const requestSchema = z.object({
  userName: z.string().min(1).max(40),
  history: z.array(
    z.object({
      role: z.enum(["ai-question", "user-answer", "ai-reaction"]),
      text: z.string(),
    }),
  ),
  /**
   * 페이스메이커가 컨텍스트로 인지할 baseline ID. 미지정 시 "skpan" (방선기).
   * /demo 트랙은 페르소나 baselineId(`minister` / `worker` / `student`)를 보냄.
   */
  baselineId: z
    .string()
    .optional()
    .refine((v) => v === undefined || isBaselineId(v), {
      message: "Invalid baselineId",
    }),
  /**
   * "demo" 모드면 suggestedAnswers 3개도 함께 생성 (박람회 게스트 빠른 답변용).
   * "me" (또는 미지정)이면 자유 답변에 집중, suggestedAnswers는 빈 배열.
   */
  mode: z.enum(["me", "demo"]).optional(),
});

const responseSchema = z.object({
  reaction: z
    .string()
    .describe(
      "직전 사용자 답변에 대한 짧은 한 문장 리액션. 첫 턴이면 환영 인사 한 줄.",
    ),
  question: z
    .string()
    .describe("다음에 던질 질문 한 문장. 자연스러운 대화체."),
  isComplete: z
    .boolean()
    .describe(
      "두 번째 사용자 답변 직후이면 true (이 때 question은 빈 문자열). 첫 답변까지는 false. 3턴 이상으로 늘리지 말 것.",
    ),
  /**
   * Q2 turn(turn=1)에서 풀 후보 중 어떤 질문을 골랐는지 id. 풀에서 그대로
   * 가져왔으면 그 id(예: "Q017"), 미세 변형해도 같은 id 유지. 풀 외 자유
   * 생성(Q1 turn 또는 후보 모두 부적절 시)이면 빈 문자열.
   */
  selectedQuestionId: z
    .string()
    .describe(
      'Q2에서 풀 후보 중 선택한 질문 id(예: "Q017"). Q1·마무리·후보 부적절 시 빈 문자열.',
    ),
  suggestedAnswers: z
    .array(z.string())
    .max(2)
    .describe(
      "demo 모드일 때 question에 대한 빠른 답변 후보 1~2개 (3개는 본 콘텐츠 결을 해침). 한 문장씩, 자연스러운 톤. 첫 질문(history 비어있는 turn)부터 매 turn마다 채움. me 모드 또는 isComplete=true일 때는 빈 배열.",
    ),
});

/**
 * 풀에서 후보 N개 뽑아 LLM에 전달할 텍스트 블록 생성.
 * id · 카테고리 · 본문 · tag 요약(여정·깊이)을 한 줄씩.
 */
function formatQuestionCandidates(candidates: Question[]): string {
  const lines: string[] = [
    "[★ Q2 질문 후보 — 아래 list 중 1개 선택 ★]",
    "사용자 컨텍스트(직전 답변 / baseline / 일기)와 가장 결이 맞는 1개를 골라",
    "question 필드에 그대로 또는 사용자 표현 한 조각만 살짝 녹여 넣으세요.",
    "selectedQuestionId 필드에 선택한 id(예: Q017)를 출력하세요.",
    "후보를 자기 마음대로 새로 만들지 마세요 — list 안에서만 선택.",
    "",
  ];
  for (const q of candidates) {
    const cat = CATEGORY_NAMES[q.category];
    const journey = q.journey.join("·");
    lines.push(
      `- ${q.id} [${cat} / ${q.depth} / ${journey}] ${q.text}`,
    );
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error: "AI 키 설정에 문제가 있어요. 박람회 운영자에게 알려주세요.",
        detail: "GOOGLE_GENERATIVE_AI_API_KEY missing.",
      },
      { status: 500 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await request.json();
    body = requestSchema.parse(raw);
  } catch (err) {
    return Response.json(
      { error: "잘못된 요청 형식이에요.", detail: String(err) },
      { status: 400 },
    );
  }

  const { userName, history, baselineId, mode } = body;
  const userTurns = history.filter((m) => m.role === "user-answer").length;

  let baselineSummary: string | undefined;
  let recentAnswersContext: string | undefined;
  let recentDiaryContext: string | undefined;
  let q2CandidatesBlock: string | undefined;
  let q2CandidateIds: string[] = [];

  if (baselineId && isBaselineId(baselineId)) {
    // demo 트랙 — 페르소나 baseline (게스트도 호출 가능, 본인 데이터 조회 X)
    baselineSummary = summarizeBaseline(getBaseline(baselineId));
  } else {
    // me 트랙 — 인증 사용자라면 본인 baseline·답변·일기 조회해 컨텍스트로.
    // 셋 다 비어 있으면 LLM은 일반 톤으로 fallback (pacemaker prompt에 명시).
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // turn=1(Q2 차례)일 때만 본인이 최근 N개 turn에 받았던 question_id 조회 —
      // recency cooldown 차단용. N 넘긴 질문은 다시 풀에 복귀.
      // Q1 turn(turn=0)에는 풀을 안 쓰므로 skip.
      const usedIdsPromise =
        userTurns === 1
          ? supabase
              .from("qa_pair")
              .select("question_id, created_at")
              .eq("user_id", user.id)
              .not("question_id", "is", null)
              .order("created_at", { ascending: false })
              .limit(RECENT_DEDUP_WINDOW)
          : Promise.resolve({ data: null as null | Array<{ question_id: string | null }> });

      const [baselineRes, qaRes, diaryRes, usedIdsRes] = await Promise.all([
        supabase
          .from("baseline_report")
          .select("report")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("qa_pair")
          .select("question_text, answer_text, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("somyeong_entries")
          .select("entry_date, answer, free_note")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false })
          .limit(5),
        usedIdsPromise,
      ]);

      if (baselineRes.data?.report) {
        baselineSummary = summarizeBaselineShape(
          baselineRes.data.report as BaselineShape,
        );
      }
      if (qaRes.data) {
        recentAnswersContext = formatRecentAnswers(qaRes.data);
      }
      if (diaryRes.data) {
        recentDiaryContext = formatRecentDiary(diaryRes.data);
      }

      // Q2 후보 빌드 — turn=1이고 풀에 남은 게 있을 때만
      if (userTurns === 1) {
        const usedIds = new Set<string>(
          (usedIdsRes.data ?? [])
            .map((r) => r.question_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        );
        const unused = filterUnused(usedIds);
        if (unused.length > 0) {
          // V1 score — journey/depth context 없이 단순 정렬 + 약한 shuffle.
          // 같은 점수 안에서 매번 같은 순서 나오면 사용자 경험 단조로움.
          const ranked = unused
            .map((q) => ({ q, score: scoreQuestion(q, {}) + Math.random() * 0.4 }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((x) => x.q);
          q2CandidatesBlock = formatQuestionCandidates(ranked);
          q2CandidateIds = ranked.map((q) => q.id);
        } else {
          // 풀 전부가 최근 cooldown 안에 들어 있는 극단 상황 — 이론상 풀 ≤ N일
          // 때만 발생. LLM에 자유 생성하라고 신호 (풀 확장 또는 N 조정 필요).
          q2CandidatesBlock =
            "[Q2 풀 후보 없음]\n현재 풀이 전부 최근 cooldown(receny window) 안에 있습니다. 이번 turn은 풀 없이 자유 생성하되 selectedQuestionId는 빈 문자열로 두세요.";
        }
      }

      // 디버그 — Vercel logs에서 컨텍스트 주입 상태 확인용
      console.log("[chat] context for user:", {
        userId: user.id,
        turn: userTurns,
        baselineLoaded: !!baselineSummary,
        baselineLen: baselineSummary?.length ?? 0,
        recentAnswersCount: qaRes.data?.length ?? 0,
        recentAnswersLen: recentAnswersContext?.length ?? 0,
        recentDiaryCount: diaryRes.data?.length ?? 0,
        recentDiaryLen: recentDiaryContext?.length ?? 0,
        poolCandidateCount: q2CandidateIds.length,
        poolTotalSize: QUESTION_POOL.length,
        poolRecentBlockedCount: (usedIdsRes.data ?? []).length,
        poolDedupWindow: RECENT_DEDUP_WINDOW,
      });
    } else {
      console.log("[chat] no user — me track called without auth", {
        userTurns,
      });
    }
  }

  const messages: ModelMessage[] = [
    {
      role: "system",
      content: buildContextHeader({
        userName,
        turn: userTurns,
        baselineSummary,
        recentAnswers: recentAnswersContext,
        recentDiary: recentDiaryContext,
        mode,
        q2Candidates: q2CandidatesBlock,
      }),
    },
    ...history.map<ModelMessage>((m) => {
      if (m.role === "user-answer") {
        return { role: "user", content: m.text };
      }
      return { role: "assistant", content: m.text };
    }),
  ];

  if (history.length === 0) {
    messages.push({
      role: "user",
      content: "(아직 사용자 답변 없음 — 첫 인사 + 첫 질문을 시작하세요.)",
    });
  }

  try {
    const { output } = await generateText({
      // chat은 Q1/Q2 역할 분리·baseline 환기 등 prompt 디테일을 정확히
      // 따라야 사용자 가치(개인화 질문)가 살아나서 Flash로 업그레이드.
      // 비용은 3배지만 11명 규모에서 월 ~₩540 수준이라 무시 가능.
      // 다른 호출(digest·answer-card·transcribe·diary)은 flash-lite 유지.
      model: google("gemini-2.5-flash"),
      system: PACEMAKER_SYSTEM_PROMPT,
      messages,
      output: Output.object({ schema: responseSchema }),
    });

    // Server-side hard caps:
    //  1. 두 번째 답변 받았으면 무조건 마무리 ("매일 두 질문" 약속 강제)
    //  2. me 트랙(mode != "demo")은 suggestedAnswers 항상 빈 배열 — LLM이
    //     가이드 무시하고 채워도 빠른 답변 칩 노출 차단.
    //  3. selectedQuestionId는 후보 list에 있을 때만 인정 — LLM이 환각으로
    //     가짜 id를 만들어도 클라이언트에 깨끗한 값만 흘림.
    const isDemoMode = mode === "demo";
    const candidateIdSet = new Set(q2CandidateIds);
    const rawSelectedId =
      typeof output.selectedQuestionId === "string"
        ? output.selectedQuestionId.trim()
        : "";
    const validatedSelectedId =
      rawSelectedId.length > 0 && candidateIdSet.has(rawSelectedId)
        ? rawSelectedId
        : "";

    if (userTurns === 1 && q2CandidateIds.length > 0 && !validatedSelectedId) {
      console.warn(
        "[chat] turn=1 but selectedQuestionId not in candidates",
        { raw: rawSelectedId, candidateCount: q2CandidateIds.length },
      );
    }

    const finalOutput = {
      ...output,
      selectedQuestionId: validatedSelectedId,
      suggestedAnswers: isDemoMode ? output.suggestedAnswers : [],
    };

    if (userTurns >= 2) {
      return Response.json({
        ...finalOutput,
        isComplete: true,
        question: "",
        selectedQuestionId: "",
        suggestedAnswers: [],
      });
    }

    return Response.json(finalOutput);
  } catch (err) {
    console.error("[/api/me/chat] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
