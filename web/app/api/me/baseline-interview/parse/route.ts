import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyGeminiError } from "@/lib/ai/error-helpers";

export const runtime = "nodejs";

const inputSchema = z.object({
  text: z.string().min(20).max(50000),
});

const outputSchema = z.object({
  headline: z
    .string()
    .min(5)
    .max(60)
    .describe(
      "사용자의 본질·소명을 한 줄로 요약 — '~ 하는 일' 또는 '~한 것' 형태. 사용자의 어휘를 살려서.",
    ),
  parts: z
    .array(
      z.object({
        partTitle: z.enum(["가치 있는 것", "좋아하는 것", "잘하는 것"]),
        items: z
          .array(
            z.object({
              title: z
                .string()
                .min(2)
                .max(50)
                .describe(
                  "항목 제목 — 짧고 구체적. 예: '사람의 성장을 보는 것', '한 사람에 집중하고 파악하는 것'",
                ),
              description: z
                .array(z.string().min(5).max(400))
                .min(1)
                .max(3)
                .describe(
                  "1~3 문단. 각 문단은 사용자의 어휘를 살려 1~2문장으로 자기 어조처럼.",
                ),
            }),
          )
          .min(1)
          .max(5),
        insight: z
          .string()
          .min(20)
          .max(300)
          .describe("이 Part의 핵심 통찰을 1~2 문장으로. '~님은' 호칭으로 시작 가능."),
        keywords: z
          .array(z.string().min(2).max(20))
          .min(3)
          .max(7)
          .describe("이 Part를 대표하는 키워드 3~7개"),
      }),
    )
    .min(1)
    .max(3)
    .describe(
      "세 Part(가치 있는 것 / 좋아하는 것 / 잘하는 것) 모두 추출. 자료에 없는 Part는 빠질 수 있음.",
    ),
});

const SYSTEM_PROMPT = `당신은 자기 발견을 돕는 정리 도우미입니다.

사용자가 자신에 대해 적어둔 자료(노트·셀프인터뷰 PDF 텍스트·자유 메모 등)를 받아, 다음 3 Part 구조로 정리합니다:

1. **가치 있는 것** — 사용자에게 소중한 것, 추구하는 모습, 가치관
2. **좋아하는 것** — 가장 큰 기쁨·성취감을 주는 일이나 경험
3. **잘하는 것** — 배워서 얻은 스킬이 아니라 자연스럽게 잘되는 강점

원칙:
- **사용자의 표현·어휘를 최대한 보존**. paraphrase·과한 정리 X. 사용자가 적은 톤을 그대로.
- 자료에 명시적으로 안 나타난 항목은 만들지 말 것. 추측·창작 금지.
- 각 Part 아래 항목 1~5개. 자료가 빈약하면 적은 수로 두는 게 정직.
- headline은 사용자의 본질을 한 줄로 요약. '~한 일' / '~한 것' 형식. 사용자의 표현을 살려서.
- 한국어로 답변. 출력 schema는 시스템이 강제함.`;

export async function POST(request: Request) {
  // 1) 인증 체크
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Gemini 키 확인
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error: "AI 키 설정에 문제가 있어요.",
        detail: "GOOGLE_GENERATIVE_AI_API_KEY missing.",
      },
      { status: 500 },
    );
  }

  // 3) 입력 검증
  let parsed: z.infer<typeof inputSchema>;
  try {
    const raw = await request.json();
    parsed = inputSchema.parse(raw);
  } catch (err) {
    return Response.json(
      { error: "잘못된 요청 형식이에요.", detail: String(err) },
      { status: 400 },
    );
  }

  // 4) LLM 호출
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `아래 자료를 위 구조로 정리해 주세요.\n\n---\n\n${parsed.text}`,
        },
      ],
      output: Output.object({ schema: outputSchema }),
    });

    return Response.json({ parsed: output });
  } catch (err) {
    console.error("[/api/me/baseline-interview/parse] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }
}
