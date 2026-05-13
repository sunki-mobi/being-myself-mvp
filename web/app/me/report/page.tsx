import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shapeToFullReport } from "@/lib/me/baseline-adapter";
import type { BaselineShape } from "@/lib/me/baseline-shape";
import { MeReportClient } from "./MeReportClient";

/**
 * /me/report — 본인 baseline 기반 오늘 보고서.
 *
 * Server component에서 사용자 + baseline_report 조회. baseline 없으면 /me로
 * 보내서 진입 카드 화면(셀프인터뷰 / Import)을 다시 보게.
 */
export default async function MeReportPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/report");

  const { data: baselineRow } = await supabase
    .from("baseline_report")
    .select("report")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!baselineRow) redirect("/me");

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

  const shape = baselineRow.report as BaselineShape;
  const baseline = shapeToFullReport(shape, { userName: displayName });

  return <MeReportClient baseline={baseline} />;
}
