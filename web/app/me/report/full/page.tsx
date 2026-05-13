import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shapeToFullReport } from "@/lib/me/baseline-adapter";
import type { BaselineShape } from "@/lib/me/baseline-shape";
import { MeReportFullClient } from "./MeReportFullClient";

/**
 * /me/report/full — 본인 baseline 전체 보고서 (3 Part).
 *
 * Server component에서 사용자 + baseline_report 조회 후 client island에 풀 shape 전달.
 */
export default async function MeReportFullPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/report/full");

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

  return <MeReportFullClient baseline={baseline} />;
}
