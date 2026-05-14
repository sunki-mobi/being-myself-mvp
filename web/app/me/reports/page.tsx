import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReportsHubClient } from "./ReportsHubClient";

/**
 * /me/reports — 내 모든 보고서·답변 누적 hub.
 *
 * 카드:
 *  - 셀프인터뷰 보고서 (3 Part baseline → /me/report/full)
 *  - 지금까지의 모습 (4단계 누적 → /me/long-term)
 *  - 매일 두 질문 디제스트 (오늘 답변 카드 + connection → /me/report)
 *  - 소명일기 누적 (/me/diary)
 *
 * baseline 없으면 /me로.
 */
export default async function MeReportsHubPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/reports");

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

  // 누적 카운트 — 사용자에게 진척감 표시
  const { count: qaCount } = await supabase
    .from("qa_pair")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: diaryCount } = await supabase
    .from("somyeong_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <ReportsHubClient
      displayName={displayName}
      qaCount={qaCount ?? 0}
      diaryCount={diaryCount ?? 0}
    />
  );
}
