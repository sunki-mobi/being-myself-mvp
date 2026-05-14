import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/me/prepare-seen — 사용자 user_settings.prepare_seen=true 마킹.
 *
 * /me/baseline/prepare의 마지막 step CTA 클릭 시 호출. 멱등 (이미 true여도 OK).
 * 호출자가 redirect는 클라이언트에서 처리.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // upsert — 트리거가 가입 시 row 만들어 두지만, 안전하게 upsert
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        prepare_seen: true,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
