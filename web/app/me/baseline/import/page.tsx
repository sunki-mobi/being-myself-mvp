import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImportClient } from "./ImportClient";

/**
 * /me/baseline/import — 기존 인터뷰 자료 paste → LLM 정리 → baseline 저장.
 *
 * Server-side guard: 로그인 안 됐으면 sign-in, baseline 이미 있으면 /me.
 */
export default async function BaselineImportPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/baseline/import");

  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (baseline) redirect("/me");

  return <ImportClient />;
}
