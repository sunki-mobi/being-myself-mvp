import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BASELINE_PART_TITLES } from "@/lib/me/baseline-shape";

/**
 * /api/me/baseline-report
 *
 * POST — baseline_report에 사용자의 보고서 JSON을 upsert (user_id unique).
 * source는 'interview' | 'import'. 한 사용자당 1개만 존재.
 */

const itemSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.array(z.string().min(1).max(800)).min(1).max(6),
});

const partSchema = z.object({
  partTitle: z.enum(BASELINE_PART_TITLES),
  items: z.array(itemSchema).min(1).max(8),
  insight: z.string().min(1).max(800),
  keywords: z.array(z.string().min(1).max(40)).min(1).max(10),
});

const reportSchema = z.object({
  headline: z.string().min(1).max(120),
  parts: z.array(partSchema).min(1).max(3),
});

const bodySchema = z.object({
  source: z.enum(["interview", "import"]),
  report: reportSchema,
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
      { error: "잘못된 요청 형식이에요.", detail: String(err) },
      { status: 400 },
    );
  }

  // upsert — 한 사용자당 1개 (user_id unique)
  const { error } = await supabase
    .from("baseline_report")
    .upsert(
      {
        user_id: user.id,
        source: body.source,
        report: body.report,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
