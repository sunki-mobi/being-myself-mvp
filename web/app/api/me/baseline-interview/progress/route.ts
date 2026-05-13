import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /api/me/baseline-interview/progress
 *
 * GET — 현재 사용자의 진행 상태 조회. 없으면 progress: null.
 * PUT — current_step + answers upsert. 매 step 완료 시 호출.
 */

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("baseline_interview_progress")
    .select("current_step, answers, archived, started_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { currentStep?: unknown; answers?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const currentStep =
    typeof body.currentStep === "number" && Number.isFinite(body.currentStep)
      ? body.currentStep
      : null;
  const answers =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? body.answers
      : {};

  if (currentStep === null || currentStep < 0) {
    return NextResponse.json(
      { error: "currentStep must be a non-negative number" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("baseline_interview_progress")
    .upsert(
      {
        user_id: user.id,
        current_step: currentStep,
        answers,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
