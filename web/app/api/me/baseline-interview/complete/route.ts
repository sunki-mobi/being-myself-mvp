import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyGeminiError } from "@/lib/ai/error-helpers";
import {
  BASELINE_QUESTIONS,
  TOTAL_STEPS,
  type ChoiceBranch,
  type InterviewAnswers,
} from "@/lib/me/baseline-interview-questions";

export const runtime = "nodejs";

/**
 * POST /api/me/baseline-interview/complete
 *
 * baseline_interview_progress.answers를 읽고 LLM이 BaselineShape으로 합성 →
 * baseline_report에 upsert + progress.archived=true.
 *
 * 전제: 사용자가 6 step 모두 완료했고 (current_step >= TOTAL_STEPS) baseline은
 * 아직 없음. 멱등성 — 다시 호출돼도 결과는 덮어쓰기만 (LLM 재호출).
 */

const outputSchema = z.object({
  headline: z
    .string()
    .min(5)
    .max(60)
    .describe(
      "사용자의 본질·소명을 한 줄로. '~ 하는 일' 또는 '~한 것' 형태. 사용자 어휘 유지.",
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
                .describe("항목 제목 — 짧고 구체적"),
              description: z
                .array(z.string().min(5).max(400))
                .min(1)
                .max(3)
                .describe("1~3 문단. 사용자 어휘 살려서 1~2문장씩."),
            }),
          )
          .min(1)
          .max(5),
        insight: z
          .string()
          .min(20)
          .max(300)
          .describe("이 Part의 핵심 통찰 1~2 문장."),
        keywords: z
          .array(z.string().min(2).max(20))
          .min(3)
          .max(7)
          .describe("3~7개"),
      }),
    )
    .length(3)
    .describe("3 Part 모두. 답변이 빈약해도 best-effort로 채움."),
});

const SYSTEM_PROMPT = `당신은 자기 발견을 돕는 정리 도우미입니다.

사용자가 셀프인터뷰의 3개 질문 블록에 답한 자료를 받아, 다음 구조로 정리합니다:

1. **가치 있는 것** — 사용자에게 소중한 것, 추구하는 모습, 가치관 (인터뷰의 Q3 답변)
2. **좋아하는 것** — 가장 큰 기쁨·성취감 (Q1 답변)
3. **잘하는 것** — 자연스럽게 잘되는 강점 (Q2 답변)

원칙:
- **사용자의 표현·어휘 보존**. paraphrase 최소화.
- 답변에 없는 항목은 만들지 말 것. 추측 X.
- 각 Part 아래 항목 1~5개. 답변이 짧으면 적은 수도 OK.
- headline은 사용자의 본질을 한 줄로. 사용자 어휘 살려서.
- 출력은 시스템 schema 강제 — JSON.`;

export async function POST() {
  // 1) 인증
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Gemini 키
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "AI 키 설정에 문제가 있어요." },
      { status: 500 },
    );
  }

  // 3) progress 조회
  const { data: progress, error: progressErr } = await supabase
    .from("baseline_interview_progress")
    .select("current_step, answers, archived")
    .eq("user_id", user.id)
    .maybeSingle();

  if (progressErr) {
    return Response.json(
      { error: `progress 조회 실패: ${progressErr.message}` },
      { status: 500 },
    );
  }
  if (!progress) {
    return Response.json(
      { error: "진행 중인 인터뷰가 없어요." },
      { status: 400 },
    );
  }
  if (progress.current_step < TOTAL_STEPS) {
    return Response.json(
      { error: "인터뷰가 아직 끝나지 않았어요." },
      { status: 400 },
    );
  }

  const answers = progress.answers as InterviewAnswers;

  // 4) 답변을 사람이 읽는 텍스트로 포맷 (LLM 입력)
  const answerText = formatAnswersForLLM(answers);
  if (!answerText.trim()) {
    return Response.json(
      { error: "답변 데이터가 비어있어요." },
      { status: 400 },
    );
  }

  // 5) LLM 합성
  let synthesized: z.infer<typeof outputSchema>;
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `아래 셀프인터뷰 답변을 정리해 주세요.\n\n${answerText}`,
        },
      ],
      output: Output.object({ schema: outputSchema }),
    });
    synthesized = output;
  } catch (err) {
    console.error("[/api/me/baseline-interview/complete] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }

  // 6) baseline_report upsert (user_id unique)
  const { error: upsertErr } = await supabase
    .from("baseline_report")
    .upsert(
      {
        user_id: user.id,
        source: "interview",
        report: synthesized,
      },
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    return Response.json(
      { error: `baseline 저장 실패: ${upsertErr.message}` },
      { status: 500 },
    );
  }

  // 7) progress archived 표시 (실패해도 critical 아님)
  if (!progress.archived) {
    await supabase
      .from("baseline_interview_progress")
      .update({ archived: true })
      .eq("user_id", user.id);
  }

  return Response.json({ ok: true });
}

/** answers JSON을 LLM이 읽기 좋은 텍스트로 변환. */
function formatAnswersForLLM(answers: InterviewAnswers): string {
  const lines: string[] = [];
  for (const block of BASELINE_QUESTIONS) {
    const ans = answers[block.id];
    if (!ans?.voice?.trim()) continue;

    const branchLabel = ans.choice === "knows" ? "알고 있어요" : "잘 모르겠어요";
    const voiceQuestion = block.voice[ans.choice as ChoiceBranch].text;

    lines.push(`# ${block.id.toUpperCase()} (${block.part})`);
    lines.push(`Q (객관식): ${block.choice.text}`);
    lines.push(`→ 사용자 선택: ${branchLabel}`);
    lines.push(`Q (음성): ${voiceQuestion}`);
    lines.push(`A: ${ans.voice.trim()}`);
    lines.push("");
  }
  return lines.join("\n");
}
