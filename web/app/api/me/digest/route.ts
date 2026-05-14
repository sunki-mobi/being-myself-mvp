import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  DIGEST_SYSTEM_PROMPT,
  buildDigestUserMessage,
} from "@/lib/ai/digest-prompt";
import { classifyGeminiError } from "@/lib/ai/error-helpers";
import { indexBaseline, summarizeBaseline } from "@/lib/me/baseline-report";
import { getBaseline, isBaselineId } from "@/lib/me/baselines";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  userName: z.string().min(1).max(40),
  todayAnswers: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
  /**
   * 페르소나 baseline ID. /demo 트랙에서 `minister`/`worker`/`student` 보냄.
   * me 트랙은 미지정 — 본인 baseline 컨텍스트 주입은 Phase A 작업으로 추후.
   */
  baselineId: z
    .string()
    .optional()
    .refine((v) => v === undefined || isBaselineId(v), {
      message: "Invalid baselineId",
    }),
});

const responseSchema = z.object({
  summary: z
    .string()
    .describe(
      "오늘 답변 두 개를 정리하는 2~3문장. 잡지 인터뷰 톤. 사용자 표현 미러링.",
    ),
  connections: z
    .array(
      z.object({
        partTitle: z.string().describe("baseline의 Part 제목 그대로"),
        itemTitle: z.string().describe("baseline의 항목 제목 그대로"),
        note: z
          .string()
          .describe(
            "오늘 답변과 이 항목이 어떻게 닿아 있는지 한 문장. 단정 금지.",
          ),
      }),
    )
    .max(3)
    .describe("가장 닿는 baseline 항목 1~3개. 억지로 채우지 말 것."),
  tension: z
    .string()
    .describe(
      "baseline과 오늘 답변 사이의 흥미로운 대비 한 문장. 진짜 대비가 있을 때만, 없으면 빈 문자열.",
    ),
  nextThread: z
    .string()
    .describe(
      "다음 대화에서 더 들어갈 만한 한 줄. '내일은 ~' 톤. 항상 한 줄.",
    ),
});

/**
 * KST(Asia/Seoul) 기준 오늘 날짜 YYYY-MM-DD.
 * Vercel server는 UTC라 timezone 명시 변환 필요.
 */
function getKstToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 오늘(KST) 사용자의 qa_pair 누적 수 — staleness 판단용.
 * 한 날에 새 답변이 추가되면 qa_count가 늘어남 → 캐시 invalidate.
 */
async function countTodayQaPairs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<number> {
  const today = getKstToday();
  const startKst = `${today}T00:00:00+09:00`;
  const endKst = `${today}T23:59:59.999+09:00`;
  const { count } = await supabase
    .from("qa_pair")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startKst)
    .lte("created_at", endKst);
  return count ?? 0;
}

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error: "AI 키 설정에 문제가 있어요.",
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

  const { userName, todayAnswers, baselineId } = body;

  // 인증 — me 트랙은 인증 필수. demo 트랙(baselineId 명시)도 인증된 사용자만
  // 캐시 사용 가능 (게스트는 캐시 없이 매번 LLM — V1 단순화).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // baselineId 명시 안 한 me 트랙 — Phase A 전까지 fallback (LLM 호출 안 함).
  if (!baselineId || !isBaselineId(baselineId)) {
    return Response.json({
      summary: `오늘 답해주신 ${todayAnswers.length}개 답변, 잘 담아둘게요.`,
      connections: [],
      tension: "",
      nextThread: "내일은 어떤 한 순간이 마음에 남는지 함께 살펴봐요.",
    });
  }

  // 인증된 사용자 — daily_digest 캐시 hit 시도.
  if (user) {
    const today = getKstToday();
    const currentQaCount = await countTodayQaPairs(supabase, user.id);

    const { data: cached } = await supabase
      .from("daily_digest")
      .select("digest, qa_count")
      .eq("user_id", user.id)
      .eq("digest_date", today)
      .maybeSingle();

    if (cached && cached.qa_count === currentQaCount) {
      return Response.json(cached.digest);
    }

    // 캐시 miss 또는 stale → LLM + 저장
    try {
      const baseline = getBaseline(baselineId);
      const { output } = await generateText({
        model: google("gemini-2.5-flash-lite"),
        system: DIGEST_SYSTEM_PROMPT,
        prompt: buildDigestUserMessage({
          userName,
          todayAnswers,
          index: indexBaseline(baseline),
          baselineSummary: summarizeBaseline(baseline),
        }),
        output: Output.object({ schema: responseSchema }),
      });

      await supabase.from("daily_digest").upsert(
        {
          user_id: user.id,
          digest_date: today,
          digest: output,
          qa_count: currentQaCount,
        },
        { onConflict: "user_id,digest_date" },
      );

      return Response.json(output);
    } catch (err) {
      console.error("[/api/me/digest] gemini error", err);
      const { status, body: errBody } = classifyGeminiError(err);
      return Response.json(errBody, { status });
    }
  }

  // 게스트(인증 없음) — 캐시 없이 매번 LLM. /demo 트랙 가정.
  try {
    const baseline = getBaseline(baselineId);
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: DIGEST_SYSTEM_PROMPT,
      prompt: buildDigestUserMessage({
        userName,
        todayAnswers,
        index: indexBaseline(baseline),
        baselineSummary: summarizeBaseline(baseline),
      }),
      output: Output.object({ schema: responseSchema }),
    });
    return Response.json(output);
  } catch (err) {
    console.error("[/api/me/digest] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
