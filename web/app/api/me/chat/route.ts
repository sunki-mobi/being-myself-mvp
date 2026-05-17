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
  suggestedAnswers: z
    .array(z.string())
    .max(2)
    .describe(
      "demo 모드일 때 question에 대한 빠른 답변 후보 1~2개 (3개는 본 콘텐츠 결을 해침). 한 문장씩, 자연스러운 톤. 첫 질문(history 비어있는 turn)부터 매 turn마다 채움. me 모드 또는 isComplete=true일 때는 빈 배열.",
    ),
});

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
      const [baselineRes, qaRes, diaryRes] = await Promise.all([
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
    const isDemoMode = mode === "demo";
    const finalOutput = {
      ...output,
      suggestedAnswers: isDemoMode ? output.suggestedAnswers : [],
    };

    if (userTurns >= 2) {
      return Response.json({
        ...finalOutput,
        isComplete: true,
        question: "",
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
