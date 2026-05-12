import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/baseline/import — 기존 인터뷰 자료 풀텍스트 paste (Phase 3c).
 *
 * 현재는 placeholder.
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

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-6 animate-fade-up">
        <div className="text-5xl">📋</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          기존 인터뷰 자료 가져오기
        </h1>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          이미 작성한 셀프인터뷰 텍스트(PDF·메모 등)를
          <br />
          통째로 붙여넣어 자동 분류·정리하는 기능이 곧 추가돼요.
          <br />
          <span className="text-fg-light-muted">(다음 업데이트에서 공개)</span>
        </p>
        <Link
          href="/me"
          className="mt-4 px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          ← 돌아가기
        </Link>
      </div>
    </main>
  );
}
