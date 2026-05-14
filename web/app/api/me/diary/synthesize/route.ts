import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyGeminiError } from "@/lib/ai/error-helpers";
import type { BaselineShape } from "@/lib/me/baseline-shape";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/me/diary/synthesize
 *
 * 사용자의 퇴근 보고 paste를 받아 Gemini가 "기여 흐름"으로 묶어 반환.
 *
 * Input:  { evening_report: string }
 * Output: { contribution_flow: ContributionFlow } (저장은 별도 save API에서)
 *
 * 컨텍스트:
 *   - OKR (있으면) — Direct contribution 매핑 기준
 *   - baseline (있으면) — Translated contribution 의미 부여 보조
 *   - user displayName — 호명용
 *
 * 원칙 (스펙 §2):
 *   - AI는 분석가, 평가자 X. 점수·정합도·차트 금지.
 *   - 자료에 없는 의미 강제 분류 금지 (Open question으로 둠).
 *   - 사용자 어휘 보존.
 */

/* ───────── Input ───────── */
const inputSchema = z.object({
  evening_report: z.string().min(30).max(10000),
});

/* ───────── Output schema (LLM 강제) ───────── */
const itemSchema = z.object({
  time: z.string().describe("'08:36~09:25' 같은 시간대 또는 '08:36 블록'"),
  desc: z.string().describe("그 시간에 한 일 — 사용자 어휘 그대로"),
  duration: z
    .string()
    .describe("'49분' / '2h 15m' / '—' (계산 불가능 시)"),
});

const directSchema = z.object({
  kr_code: z.string().describe("'KR2' / '사업부 KR2' 같은 코드"),
  kr_title: z
    .string()
    .describe("이 KR의 짧은 제목 (사용자가 한 눈에 알 수 있게)"),
  total_time: z.string().describe("이 KR에 쓴 총 시간 (예: '5h 9m')"),
  items: z.array(itemSchema).min(1),
});

const translatedSchema = z.object({
  meaning: z
    .string()
    .describe(
      "AI가 이름 붙인 의미 단위 — 예: '미션 호흡' / '관계 돌봄' / '환경 돌봄'",
    ),
  total_time: z.string().describe("이 의미 단위에 쓴 총 시간"),
  items: z.array(itemSchema).min(1),
  ai_note: z
    .string()
    .describe("왜 이 일이 회사에 닿는지 1~2문장. 평가 어조 금지."),
});

const openQuestionSchema = z.object({
  task: z.string().describe("어디에도 자연스럽게 안 들어간 일"),
  prompt: z
    .string()
    .describe(
      "사용자에게 묻고 싶은 질문 1문장 — '이 일은 오늘 당신에게 어떤 자리였어요?' 톤",
    ),
});

const suggestedQuestionSchema = z.object({
  source: z.enum([
    "Direct contribution에서",
    "Translated contribution에서",
    "전체 그림에서",
  ]),
  body: z
    .string()
    .min(20)
    .describe(
      "일기 prompt 질문. HTML 가능 (<strong>, <em>, <br /> 사용). 시간·KR 코드는 strong, 사용자 메모 인용은 em.",
    ),
});

const contributionFlowSchema = z.object({
  direct: z.array(directSchema).default([]),
  translated: z.array(translatedSchema).default([]),
  open_questions: z.array(openQuestionSchema).default([]),
  suggested_questions: z
    .array(suggestedQuestionSchema)
    .length(3)
    .describe(
      "정확히 3개 — Direct 1개, Translated 1개, 전체 그림 1개 (다양한 결).",
    ),
});

export type ContributionFlow = z.infer<typeof contributionFlowSchema>;

/* ───────── System prompt ───────── */
const SYSTEM_PROMPT = `당신은 사용자가 한 일을 의미 있게 보여주는 reflection 분석가입니다.
사용자의 일을 평가하지 마세요. 점수도 정합도도 분류도 출력하지 마세요.
"high/medium/low", "on-target/off-target" 같은 라벨링도 금지입니다.

당신의 일은 네 가지:

1. **Direct contribution** — 사용자의 OKR(KR 코드 부여된 목록)에 명확히 매핑되는 일을
   KR별로 묶고 시간을 합산. 자연스러운 매핑만. 억지 매핑 금지. KR이 없거나
   매핑 안 되면 빈 배열로.

2. **Translated contribution** — OKR에 직접 매핑되진 않지만 회사 미션·동료·환경에
   닿는 일을 의미 단위로 묶고 짧은 이름을 붙여주세요.
   예: "청소" → "환경 돌봄", "동료 점심" → "관계 돌봄", "전사 회의" → "미션 호흡".
   외부에선 의미 없어 보이지만 회사가 기능하기 위해 필요한 일들.
   ai_note에 "왜 이게 회사에 닿는 일인지" 1~2문장 (평가 어조 절대 금지).

3. **Open question** — 위 둘 어디에도 자연스럽게 들어가지 않는 일은 사용자에게
   직접 물어보세요. "이 일은 오늘 당신에게 어떤 자리였어요?" 같은 톤.
   강제 분류 금지. 모르는 게 정직함입니다. 빈 배열로 둬도 OK.

4. **Suggested questions** — 일기 prompt 정확히 3개:
   - "Direct contribution에서" 1개 (시간이 가장 길었던 KR 기반)
   - "Translated contribution에서" 1개 (의미 있게 번역된 일 기반)
   - "전체 그림에서" 1개 (계획에 없던 일, 야근, 이슈 메모 등 텍스처가 풍부한 곳)

질문 어조: 발견을 돕는 분석가. "어땠어요?"보다 "어느 매듭을 풀어줬어요?"
같은 구체적인 질문. 본인 메모는 인용(<em>), 시간·KR 코드는 강조(<strong>).
<br /> 줄바꿈 OK.

출력은 system 강제 schema(JSON). 한국어.`;

/* ───────── Context formatting ───────── */

type KeyResult = { code?: string; title?: string; owner?: string };
type Objective = { title?: string; key_results?: KeyResult[] };
type OkrData = {
  objectives?: Objective[];
  사업부_okr?: KeyResult[];
};

function formatOkrContext(okrRow: {
  mission_text?: string | null;
  weekly_goal?: string | null;
  okr_data?: unknown;
}): string {
  const lines: string[] = [];
  if (okrRow.mission_text) {
    lines.push("[사업부 미션]");
    lines.push(okrRow.mission_text);
    lines.push("");
  }
  if (okrRow.weekly_goal) {
    lines.push("[금주 목표]");
    lines.push(okrRow.weekly_goal);
    lines.push("");
  }

  const okr = (okrRow.okr_data as OkrData | undefined) ?? {};
  if (okr.objectives && okr.objectives.length > 0) {
    lines.push("[Objectives / Key Results]");
    for (const obj of okr.objectives) {
      lines.push(`- ${obj.title ?? "(no title)"}`);
      for (const kr of obj.key_results ?? []) {
        const owner = kr.owner ? ` [${kr.owner}]` : "";
        lines.push(`  · ${kr.code ?? "?"}: ${kr.title ?? ""}${owner}`);
      }
    }
    lines.push("");
  }

  if (okr.사업부_okr && okr.사업부_okr.length > 0) {
    lines.push("[사업부 KR — 본인 owner인 항목]");
    for (const kr of okr.사업부_okr) {
      const owner = kr.owner ? ` [${kr.owner}]` : "";
      lines.push(`- ${kr.code ?? "?"}: ${kr.title ?? ""}${owner}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatBaselineContext(shape: BaselineShape): string {
  const lines: string[] = [];
  lines.push("[Being Myself 셀프인터뷰 보조 컨텍스트]");
  lines.push(`한 줄 요약: ${shape.headline}`);
  for (const part of shape.parts) {
    lines.push(
      `- ${part.partTitle} 키워드: ${part.keywords.join(", ")}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

/* ───────── Handler ───────── */
export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "AI 키 설정에 문제가 있어요." },
      { status: 500 },
    );
  }

  // 1) 인증
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) 입력 검증
  let body: z.infer<typeof inputSchema>;
  try {
    const raw = await request.json();
    body = inputSchema.parse(raw);
  } catch (err) {
    return Response.json(
      {
        error: "퇴근 보고를 최소 30자 이상 입력해주세요.",
        detail: String(err),
      },
      { status: 400 },
    );
  }

  // 3) 사용자 컨텍스트 (이름·OKR·baseline)
  const [profileRes, okrRes, baselineRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("somyeong_user_okr")
      .select("mission_text, weekly_goal, okr_data, quarter")
      .eq("user_id", user.id)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("baseline_report")
      .select("report")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const displayName =
    profileRes.data?.display_name?.trim() ||
    profileRes.data?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "사용자";

  const okrContext = okrRes.data ? formatOkrContext(okrRes.data) : "";
  const baselineContext = baselineRes.data
    ? formatBaselineContext(baselineRes.data.report as BaselineShape)
    : "";

  const userPrompt = [
    `사용자: ${displayName}님`,
    "",
    okrContext || "[OKR 미등록 — Direct contribution은 빈 배열로 두고 Translated 중심으로 정리]",
    baselineContext,
    "[퇴근 보고]",
    body.evening_report,
    "",
    "위 자료를 4 섹션(direct · translated · open_questions · suggested_questions)으로 정리해 주세요.",
  ].join("\n");

  // 4) LLM 호출
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output: Output.object({ schema: contributionFlowSchema }),
    });

    return Response.json({ contribution_flow: output });
  } catch (err) {
    console.error("[/api/me/diary/synthesize] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
