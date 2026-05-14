import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoalFormClient } from "./GoalFormClient";

/**
 * /me/settings/goal — "내 목표" 등록·수정.
 *
 * OKR/KPI/분기 목표 등 어떤 형태든 자유 입력. 작성하면 일기 합성 시
 * 컨텍스트로 주입. 의무 아님 — 작성 안 해도 일기 동작.
 *
 * DB: somyeong_user_okr 활용
 *  - quarter: period 입력값 (예: "2026-Q2", "이번 주", "default")
 *  - okr_data: { raw_text: body }
 */
export default async function MeSettingsGoalPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/settings/goal");

  // 가장 최근 1건만 — 단순화: row 1개만 유지하는 흐름 (form save에서 upsert)
  const { data: existing } = await supabase
    .from("somyeong_user_okr")
    .select("quarter, okr_data, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialPeriod = (existing?.quarter as string | undefined) ?? "";
  const initialBody =
    (existing?.okr_data as { raw_text?: string } | null)?.raw_text ?? "";

  return (
    <GoalFormClient
      initialPeriod={initialPeriod}
      initialBody={initialBody}
    />
  );
}
