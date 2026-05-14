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
   * 페이스메이커가 컨텍스트로 인지할 baseline ID. 미지정 시 "skpan" (방선기).
   * /demo 트랙은 페르소나 baselineId(`minister` / `worker` / `student`)를 보냄.
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

  const { userName, todayAnswers, baselineId } = body;

  // baselineId 명시 시에만 페르소나 baseline로 connections 매칭 (demo 트랙용).
  // 미지정 시(me 트랙) 시드 skpan baseline이 LLM에 노출되는 risk 차단 위해
  // connections 없이 단순 fallback 반환. 본인 baseline 매칭은 추후 fix.
  if (!baselineId || !isBaselineId(baselineId)) {
    return Response.json({
      summary: `오늘 답해주신 ${todayAnswers.length}개 답변, 잘 담아둘게요.`,
      connections: [],
      tension: "",
      nextThread: "내일은 어떤 한 순간이 마음에 남는지 함께 살펴봐요.",
    });
  }

  const baseline = getBaseline(baselineId);

  try {
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
