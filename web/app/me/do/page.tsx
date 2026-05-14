import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DoHubClient } from "./DoHubClient";

/**
 * /me/do — 오늘 할 수 있는 일 hub.
 *
 * Server component에서 사용자·baseline·오늘 소명일기 존재 여부 등 조회 후
 * client island로 전달. baseline 없으면 /me로 (BaselineSelectClient 보게).
 */
export default async function MeDoHubPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/do");

  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!baseline) redirect("/me");

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

  // 오늘 소명일기 entry 존재 여부 (사용자 시간대 today)
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayDiary } = await supabase
    .from("somyeong_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle();

  return (
    <DoHubClient
      displayName={displayName}
      hasTodayDiary={Boolean(todayDiary)}
    />
  );
}
