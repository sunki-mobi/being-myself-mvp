import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MeLandingClient } from "./MeLandingClient";

/**
 * /me — 로그인 사용자 홈.
 *
 * Server component에서 사용자 + profile 조회 후 client island로 전달.
 * middleware가 1차 가드, 여기서 2차 가드(direct hit 방어).
 *
 * Phase 1: profile.display_name을 헤더에 표시. 셀프인터뷰·보고서 흐름은
 * 기존 LocalStorage 기반 그대로 — Phase 2에서 server-backed로 마이그레이션.
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

  return <MeLandingClient displayName={displayName} email={user.email ?? ""} />;
}
