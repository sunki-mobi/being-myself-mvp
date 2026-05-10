import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  ANSWER_CARD_SYSTEM_PROMPT,
  buildAnswerCardUserMessage,
} from "@/lib/ai/answer-card-prompt";
import { classifyGeminiError } from "@/lib/ai/error-helpers";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
});

const responseSchema = z.object({
  subtopics: z
    .array(
      z.object({
        title: z
          .string()
          .describe("소주제 제목 — 답변 내용을 함축한 명사형."),
        bullets: z
          .array(z.string())
          .min(1)
          .describe(
            "글머리기호. 각 2~3문장 이내, 핵심 위주. 구어체 어투 유지.",
          ),
      }),
    )
    .min(1)
    .max(5)
    .describe(
      "답변에서 다루는 소주제별 카드. 답변이 짧으면 1개, 길면 여러 개.",
    ),
  summary: z
    .string()
    .describe(
      "이 사람이 실제로 말한 핵심 내용을 2~3문장으로 요약. 잡지 인터뷰 톤.",
    ),
  keywords: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe("핵심 키워드 3~5개."),
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

  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: ANSWER_CARD_SYSTEM_PROMPT,
      prompt: buildAnswerCardUserMessage(body),
      output: Output.object({ schema: responseSchema }),
    });

    return Response.json(output);
  } catch (err) {
    console.error("[/api/me/answer-card] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
