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

export const runtime = "nodejs";

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

  // baselineId가 있으면 그 페르소나 baseline 사용, 없으면 방선기(skpan) 기본.
  const resolvedBaselineId =
    baselineId && isBaselineId(baselineId) ? baselineId : "skpan";
  const baselineSummary = summarizeBaseline(getBaseline(resolvedBaselineId));

  const messages: ModelMessage[] = [
    {
      role: "system",
      content: buildContextHeader({
        userName,
        turn: userTurns,
        baselineSummary,
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
      model: google("gemini-2.5-flash-lite"),
      system: PACEMAKER_SYSTEM_PROMPT,
      messages,
      output: Output.object({ schema: responseSchema }),
    });

    // Server-side hard cap — 두 번째 답변 받았으면 무조건 마무리.
    // LLM이 prompt를 무시해도 "매일 두 질문" 약속 강제.
    if (userTurns >= 2) {
      return Response.json({
        ...output,
        isComplete: true,
        question: "",
        suggestedAnswers: [],
      });
    }

    return Response.json(output);
  } catch (err) {
    console.error("[/api/me/chat] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
