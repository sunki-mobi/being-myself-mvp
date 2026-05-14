import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/me/diary/save
 *
 * 오늘 entry 저장 (user_id + entry_date unique → 재작성은 update).
 * answer / free_note 중 하나는 채워져야 함 (application 단에서 강제).
 */

const itemSchema = z.object({
  time: z.string(),
  desc: z.string(),
  duration: z.string(),
});

const contributionFlowSchema = z.object({
  direct: z
    .array(
      z.object({
        kr_code: z.string(),
        kr_title: z.string(),
        total_time: z.string(),
        items: z.array(itemSchema),
      }),
    )
    .default([]),
  translated: z
    .array(
      z.object({
        meaning: z.string(),
        total_time: z.string(),
        items: z.array(itemSchema),
        ai_note: z.string(),
      }),
    )
    .default([]),
  open_questions: z
    .array(
      z.object({
        task: z.string(),
        prompt: z.string(),
      }),
    )
    .default([]),
  suggested_questions: z
    .array(
      z.object({
        source: z.string(),
        body: z.string(),
      }),
    )
    .default([]),
});

const bodySchema = z
  .object({
    evening_report: z.string().min(20).max(10000),
    contribution_flow: contributionFlowSchema,
    ai_question: z.string().max(2000).nullable().optional(),
    ai_question_source: z.string().max(100).nullable().optional(),
    answer: z.string().max(8000).nullable().optional(),
    free_note: z.string().max(8000).nullable().optional(),
    entry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine((d) => (d.answer ?? "").trim() || (d.free_note ?? "").trim(), {
    message: "answer 또는 free_note 중 최소 하나는 입력해야 해요.",
    path: ["answer"],
  });

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    body = bodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: "입력을 다시 확인해주세요.", detail: String(err) },
      { status: 400 },
    );
  }

  const entryDate = body.entry_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("somyeong_entries")
    .upsert(
      {
        user_id: user.id,
        entry_date: entryDate,
        evening_report_text: body.evening_report,
        contribution_flow: body.contribution_flow,
        ai_question: body.ai_question ?? null,
        ai_question_source: body.ai_question_source ?? null,
        answer: body.answer ?? null,
        free_note: body.free_note ?? null,
      },
      { onConflict: "user_id,entry_date" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entryId: data.id });
}
