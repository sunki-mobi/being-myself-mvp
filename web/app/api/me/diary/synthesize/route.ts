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
    "내 OKR에 닿은 일에서",
    "OKR 밖에서 닿은 일에서",
    "오늘 전체에서",
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
const SYSTEM_PROMPT = `당신은 사용자가 한 일의 의미를 비춰주는 코치입니다.
분석가도 평가자도 아닙니다. 점수도 정합도도 분류도 출력하지 마세요.
"high/medium/low", "on-target/off-target" 같은 라벨링도 금지입니다.

당신의 일은 네 가지:

1. **direct (내 OKR에 닿은 일)** — 사용자의 OKR(KR 코드 부여된 목록)에 명확히
   매핑되는 일을 KR별로 묶고 시간을 합산. 자연스러운 매핑만. 억지 매핑 금지.
   KR이 없거나 매핑 안 되면 빈 배열로.

2. **translated (OKR 밖에서 닿은 일)** — OKR에 직접 매핑되진 않지만 회사 미션·
   동료·환경에 닿는 일을 의미 단위로 묶고 짧은 이름을 붙여주세요.
   예: "청소" → "환경 돌봄", "동료 점심" → "관계 돌봄", "전사 회의" → "미션 호흡".
   외부에선 의미 없어 보이지만 회사가 기능하기 위해 필요한 일들.
   ai_note에 "이 일이 어떻게 회사에 닿는지" 1~2문장 (평가 어조 절대 금지,
   해석을 강요하지 말고 짚어주는 톤).

3. **open_questions (더 들여다볼 일)** — 위 둘 어디에도 자연스럽게 들어가지
   않는 일은 사용자에게 직접 물어보세요. "이 일은 오늘 당신에게 어떤
   자리였어요?" 같은 톤. 강제 분류 금지. 모르는 게 정직함입니다. 빈
   배열로 둬도 OK.

4. **suggested_questions** — 일기 prompt 정확히 3개. **이 질문들은 단순한
   리뷰가 아니라 코칭 질문**이어야 합니다. 아래 [코칭 질문 원칙]을 반드시
   따르세요. 서로 다른 시선으로:
   - source="내 OKR에 닿은 일에서" 1개 (시간이 가장 길었던 KR 기반)
   - source="OKR 밖에서 닿은 일에서" 1개 (의미 있게 번역된 일 기반)
   - source="오늘 전체에서" 1개 (계획에 없던 일, 야근, 이슈 메모 등 텍스처가
     풍부한 곳)

[코칭 질문 원칙 — suggested_questions 생성에 적용]
사용자가 답을 스스로 찾도록 좋은 질문을 던지는 코치의 어조입니다. 다음 6가지를
반드시 지키세요:

(1) **코치처럼 — 답을 주지 말 것**. 해석·요약·조언 금지. 사용자가 직접 의미를
    발견하도록 길을 여는 질문만. "오늘 ~한 것은 의미있는 일이었네요. 어떻게
    생각하세요?"처럼 답을 앞세우고 묻지 마세요. 질문 자체로 발견을 유도.

(2) **해결 중심 (Solution-Focused)** — 문제·결핍·원인 분석 대신 "작동했던 것 /
    살아있게 느껴졌던 순간 / 이미 가지고 있던 자원"으로 시선을 옮기세요.
    "왜 [KR]에 시간이 부족했나요?"보다 "<strong>KR2</strong>에 5h 9m을
    쏟은 그 시간 안에서 가장 살아있게 느껴진 한 조각은 무엇이었나요?".

(3) **What, not Why** — "왜?" 질문 금지. "왜"는 self-defensive하게 만들고
    합리화를 부릅니다. Tasha Eurich 연구가 분명히 보여줍니다. 대신 "무엇·
    어떤·어떻게"를 쓰세요.
    - 피하기: "왜 그 일을 했어요?" / "왜 시간이 그렇게 걸렸어요?"
    - 권장: "그 일에서 무엇이 가장 마음에 남았어요?" / "어떤 매듭을 풀어준
      시간이었어요?"

(4) **짧고 개방적인 질문** — 한 문장, yes/no로 닫히지 않게, 평이한 단어.
    한 번에 두 가지를 묶지 마세요. "어땠어요?" 같은 막연한 질문 대신
    "<strong>OKR 밖에서 닿은 일</strong> 중 오늘 어느 한 순간이 가장
    당신답게 느껴졌어요?" 같이 답이 펼쳐질 공간을 갖춘 구체적 질문.

(5) **사용자 어휘 미러링** — 사용자가 메모에 쓴 표현이 있다면 그 표현을
    그대로 <em>으로 인용해서 질문에 박아주세요. 임의로 바꿔 해석하지 마세요.
    예: 사용자 메모에 "정리되는 느낌"이 있다면 → "오늘 <em>정리되는 느낌</em>
    이 가장 짙었던 한 매듭은 어디였어요?".

(6) **재표현(Formulation) + 질문 한 호흡** — 필요하다면 질문 앞에 짧은 짚어
    주기 한 조각(시간·KR 코드 강조)을 두고, 본 질문을 잇습니다.
    예: "<strong>KR2</strong>에 <strong>5h 9m</strong>을 보낸 오늘. 그
    안에서 어떤 한 매듭이 가장 살아있게 느껴졌어요?"

[기술적 마크업]
시간·KR 코드는 <strong>으로 강조. 사용자 메모 인용은 <em>으로 인용.
<br /> 줄바꿈 OK. 본인 메모를 그대로 인용할 때만 <em> 사용 — AI가 만든
표현에는 쓰지 말 것.

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
