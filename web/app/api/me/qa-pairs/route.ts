import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/me/qa-pairs — 한 turn 완성 시 fire-and-forget 누적 저장.
 *
 * Body:
 *   {
 *     conversationId: string (client-generated UUID),
 *     questionIndex: number,
 *     questionText: string,
 *     reactionText?: string  // 답변 후 AI reaction (있을 때만)
 *     answerText: string,
 *     isLast?: boolean       // 마지막 turn이면 conversation.is_complete=true
 *   }
 *
 * 동작:
 *   1. conversation row를 upsert (id로 idempotent)
 *   2. qa_pair INSERT (conversation_id + question_index unique → 같은 turn 재호출 시 409)
 *   3. isLast이면 conversation.is_complete + completed_at 업데이트
 *
 * RLS: auth.uid() = user_id로 격리. user_id는 서버가 session에서 채움.
 */

type Body = {
  conversationId?: unknown;
  questionIndex?: unknown;
  questionText?: unknown;
  reactionText?: unknown;
  answerText?: unknown;
  isLast?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest("body must be JSON");
  }

  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  const questionIndex = typeof body.questionIndex === "number" ? body.questionIndex : null;
  const questionText = typeof body.questionText === "string" ? body.questionText.trim() : "";
  const answerText = typeof body.answerText === "string" ? body.answerText.trim() : "";
  const reactionText =
    typeof body.reactionText === "string" && body.reactionText.trim().length > 0
      ? body.reactionText.trim()
      : null;
  const isLast = body.isLast === true;

  if (!conversationId) return badRequest("conversationId is required");
  if (questionIndex === null || questionIndex < 0)
    return badRequest("questionIndex must be a non-negative number");
  if (!questionText) return badRequest("questionText is required");
  if (!answerText) return badRequest("answerText is required");

  // 1) conversation upsert (idempotent). RLS는 with check를 검사하므로 user_id 명시.
  const upsertConv = await supabase
    .from("conversation")
    .upsert(
      {
        id: conversationId,
        user_id: user.id,
        track: "me",
      },
      { onConflict: "id" },
    );

  if (upsertConv.error) {
    return NextResponse.json(
      { error: `conversation upsert failed: ${upsertConv.error.message}` },
      { status: 500 },
    );
  }

  // 2) qa_pair insert. 같은 (conversation, question_index)는 unique이므로 재호출 시
  //    409로 떨어짐 — 클라이언트가 재시도하더라도 중복 누적은 방지됨.
  const insertQa = await supabase
    .from("qa_pair")
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      question_index: questionIndex,
      question_text: questionText,
      reaction_text: reactionText,
      answer_text: answerText,
    })
    .select("id")
    .single();

  if (insertQa.error) {
    // unique violation은 멱등으로 처리 — 이미 저장된 turn으로 간주
    if (insertQa.error.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    return NextResponse.json(
      { error: `qa_pair insert failed: ${insertQa.error.message}` },
      { status: 500 },
    );
  }

  // 3) 마지막 turn이면 conversation 완료 표시
  if (isLast) {
    const updateConv = await supabase
      .from("conversation")
      .update({ is_complete: true, completed_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (updateConv.error) {
      // 누적 실패는 critical 아니라 콘솔만
      console.error("[qa-pairs] conversation complete update:", updateConv.error.message);
    }
  }

  return NextResponse.json({ ok: true, qaPairId: insertQa.data.id });
}
