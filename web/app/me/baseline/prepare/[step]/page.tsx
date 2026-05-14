import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOTAL_PREPARE_STEPS } from "@/lib/me/prepare-steps";
import { PrepareWrapper } from "./PrepareWrapper";

/**
 * /me/baseline/prepare/[step] — 셀프인터뷰 시작 전 마음가짐 안내 (1회).
 *
 * 진입 조건:
 *  - 로그인 사용자
 *  - baseline 아직 없음 (있으면 /me로)
 *  - user_settings.prepare_seen=false (true면 /me/baseline/interview로 skip)
 *
 * 마지막 step CTA → POST /api/me/prepare-seen → /me/baseline/interview.
 */
export default async function MeBaselinePreparePage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const n = parseInt(step, 10);

  if (Number.isNaN(n) || n < 1 || n > TOTAL_PREPARE_STEPS) {
    redirect("/me/baseline/prepare/1");
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=/me/baseline/prepare/${n}`);

  // baseline 이미 있으면 /me로 (셀프인터뷰 다시 시킬 이유 없음)
  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (baseline) redirect("/me");

  // 이미 prepare 본 사용자는 인터뷰로 직진
  const { data: settings } = await supabase
    .from("user_settings")
    .select("prepare_seen")
    .eq("user_id", user.id)
    .maybeSingle();
  if (settings?.prepare_seen) redirect("/me/baseline/interview");

  return <PrepareWrapper step={n} />;
}
