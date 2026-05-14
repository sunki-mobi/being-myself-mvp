import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /api/me/diary/okr — 사용자별 분기 OKR.
 *
 * GET: 가장 최근 OKR row 조회 (없으면 null).
 * PUT: quarter 기준 upsert (somyeong_user_okr_user_quarter_unique).
 */

const keyResultSchema = z.object({
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(300),
  owner: z.string().max(40).optional(),
});

const objectiveSchema = z.object({
  title: z.string().min(1).max(200),
  key_results: z.array(keyResultSchema).default([]),
});

const okrDataSchema = z.object({
  objectives: z.array(objectiveSchema).default([]),
  사업부_okr: z.array(keyResultSchema).default([]),
});

const bodySchema = z.object({
  quarter: z.string().min(1).max(20),
  mission_text: z.string().max(2000).nullable().optional(),
  weekly_goal: z.string().max(500).nullable().optional(),
  okr_data: okrDataSchema,
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("somyeong_user_okr")
    .select(
      "id, quarter, mission_text, weekly_goal, okr_data, effective_from, effective_to, updated_at",
    )
    .eq("user_id", user.id)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ okr: data ?? null });
}

export async function PUT(request: NextRequest) {
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
      { error: "잘못된 요청 형식이에요.", detail: String(err) },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("somyeong_user_okr")
    .upsert(
      {
        user_id: user.id,
        quarter: body.quarter,
        mission_text: body.mission_text ?? null,
        weekly_goal: body.weekly_goal ?? null,
        okr_data: body.okr_data,
      },
      { onConflict: "user_id,quarter" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
