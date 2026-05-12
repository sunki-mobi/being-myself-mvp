import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MeLandingClient } from "./MeLandingClient";
import { BaselineSelectClient } from "./BaselineSelectClient";

/**
 * /me — 로그인 사용자 홈.
 *
 * Server component에서 사용자 + profile + baseline 존재 여부 조회.
 * proxy가 1차 가드, 여기서 2차 가드(direct hit 방어).
 *
 * 분기:
 *   - baseline_report 있음 → MeLandingClient (셀프인터뷰·보고서 카드)
 *   - baseline_report 없음 → BaselineSelectClient (인터뷰 시작 / Import 두 카드)
 */
export default async function MePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/me");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "친구";

  // baseline 존재 확인 — RLS로 본인 row만 조회됨. PGRST116 (no rows)면 null.
  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const email = user.email ?? "";

  if (!baseline) {
    return <BaselineSelectClient displayName={displayName} email={email} />;
  }

  return <MeLandingClient displayName={displayName} email={email} />;
}
