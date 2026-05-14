import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/diary — 소명일기 history (placeholder).
 *
 * Step 2에서 본 구현 — entries 리스트, 카드 뷰.
 */
export default async function DiaryListPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/diary");

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-6 animate-fade-up">
        <div className="text-5xl">📔</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          내 일기 모음
        </h1>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          누적된 소명일기를 카드로 볼 수 있게 될 거예요.
          <br />
          <span className="text-fg-light-muted">(곧 추가)</span>
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/me/reports"
            className="px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            ← 보고서로
          </Link>
          <Link
            href="/me/diary/new"
            className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            오늘 일기 쓰기
          </Link>
        </div>
      </div>
    </main>
  );
}
