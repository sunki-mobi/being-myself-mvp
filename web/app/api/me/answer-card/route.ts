import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  ANSWER_CARD_SYSTEM_PROMPT,
  buildAnswerCardUserMessage,
} from "@/lib/ai/answer-card-prompt";
import { classifyGeminiError } from "@/lib/ai/error-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  /**
   * qaPairId가 있고 사용자가 로그인되어 있으면 answer_card 테이블에서 cache 조회.
   * /demo (anonymous)는 qaPairId 없이 호출 → 캐시 우회 (매번 LLM).
   */
  qaPairId: z.string().uuid().optional(),
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

type AnswerCard = z.infer<typeof responseSchema>;

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

  // 1) Cache lookup — qaPairId + 인증된 사용자 + Supabase env 가 모두 있을 때만
  const cacheEligible =
    !!body.qaPairId &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null =
    null;
  let userId: string | null = null;
  const debug: Record<string, unknown> = {
    cacheEligible,
    qaPairId: body.qaPairId ?? null,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  if (cacheEligible) {
    supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    debug.userId = user?.id ?? null;
    debug.userPresent = !!user;
    if (user) {
      userId = user.id;
      const { data: cached, error: lookupErr } = await supabase
        .from("answer_card")
        .select("card")
        .eq("qa_pair_id", body.qaPairId!)
        .maybeSingle();
      debug.cacheHit = !!cached?.card;
      if (lookupErr) debug.lookupErr = lookupErr.message;
      console.log("[/api/me/answer-card] cache lookup", debug);
      if (cached?.card) {
        return Response.json(cached.card);
      }
    } else {
      console.warn("[/api/me/answer-card] no user (auth.getUser null)", debug);
    }
  } else {
    console.warn("[/api/me/answer-card] cache not eligible", debug);
  }

  // 2) Cache miss → LLM 호출
  let card: AnswerCard;
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: ANSWER_CARD_SYSTEM_PROMPT,
      prompt: buildAnswerCardUserMessage({
        question: body.question,
        answer: body.answer,
      }),
      output: Output.object({ schema: responseSchema }),
    });
    card = output;
  } catch (err) {
    console.error("[/api/me/answer-card] gemini error", err);
    const { status, body: errBody } = classifyGeminiError(err);
    return Response.json(errBody, { status });
  }

  // 3) Cache write — qaPairId가 본인 qa_pair인지 best-effort 확인 + upsert.
  // RLS가 진짜 격리(다른 user qa_pair에 본인 user_id로 row 만들 수 없음)이라
  // ownership check는 warn 로그용만. check fail해도 upsert는 시도 — RLS가
  // 진짜 보호. (V1 — 11명 내부 사용자, 데이터 정합성 audit Risky는 차후.)
  if (supabase && userId && body.qaPairId) {
    const { data: ownerCheck } = await supabase
      .from("qa_pair")
      .select("id")
      .eq("id", body.qaPairId)
      .maybeSingle();

    if (!ownerCheck) {
      console.warn(
        "[/api/me/answer-card] qa_pair ownership check returned no row — RLS reject 또는 row 없음. upsert는 시도.",
      );
    }

    const { error: upsertErr, data: upsertData } = await supabase
      .from("answer_card")
      .upsert(
        {
          qa_pair_id: body.qaPairId,
          user_id: userId,
          card,
        },
        { onConflict: "qa_pair_id" },
      )
      .select("qa_pair_id");
    if (upsertErr) {
      console.error(
        "[/api/me/answer-card] cache write FAILED",
        JSON.stringify({
          message: upsertErr.message,
          code: upsertErr.code,
          details: upsertErr.details,
          hint: upsertErr.hint,
          userId,
          qaPairId: body.qaPairId,
          ownerCheckPresent: !!ownerCheck,
        }),
      );
    } else {
      console.log(
        "[/api/me/answer-card] cache write OK",
        JSON.stringify({
          qaPairId: body.qaPairId,
          rowsReturned: upsertData?.length ?? 0,
        }),
      );
    }
  }

  return Response.json(card);
}
