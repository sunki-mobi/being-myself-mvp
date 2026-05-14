import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/diary/new — 오늘 소명일기 작성 (placeholder).
 *
 * Step 2에서 본 구현 — paste → AI 합성 → 일기 → 저장 (3 step state machine).
 */
export default async function DiaryNewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/diary/new");

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-6 animate-fade-up">
        <div className="text-5xl">✍️</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          오늘 소명일기 쓰기
        </h1>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          퇴근 보고를 붙여넣으면 AI가 오늘의 기여를 묶어주고,
          <br />
          그 위에 일기를 쓰는 흐름이 곧 추가돼요.
          <br />
          <span className="text-fg-light-muted">(다음 단계에서 공개)</span>
        </p>
        <Link
          href="/me/do"
          className="mt-2 px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          ← 돌아가기
        </Link>
      </div>
    </main>
  );
}
