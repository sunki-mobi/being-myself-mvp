import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/baseline/interview — 음성 셀프인터뷰 (Phase 3b에서 본격 구현).
 *
 * 현재는 placeholder. baseline이 이미 있으면 /me로 보냄 (직접 접근 시
 * 의도치 않게 인터뷰 다시 시키는 거 방지).
 */
export default async function BaselineInterviewPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/baseline/interview");

  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (baseline) redirect("/me");

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-6 animate-fade-up">
        <div className="text-5xl">🎙️</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          음성 셀프인터뷰
        </h1>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          이 자리에서 약 15분간 객관식 + 음성 답변으로 진행되는
          <br />
          셀프인터뷰가 곧 시작돼요.
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
