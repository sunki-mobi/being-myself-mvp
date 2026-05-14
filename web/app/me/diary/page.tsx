import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/diary — 소명일기 history (카드 list).
 *
 * Server component에서 사용자 entries 모두 조회 후 카드로 렌더. 본인만 보임
 * (RLS로 강제). 비어있으면 "오늘 일기 쓰기" CTA만.
 */

type Entry = {
  id: string;
  entry_date: string;
  ai_question: string | null;
  ai_question_source: string | null;
  answer: string | null;
  free_note: string | null;
  created_at: string;
};

export default async function DiaryHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/diary");

  const { data, error } = await supabase
    .from("somyeong_entries")
    .select("id, entry_date, ai_question, ai_question_source, answer, free_note, created_at")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  const entries = (data ?? []) as Entry[];

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <header className="px-6 pt-10 pb-2 animate-fade-up">
          <Link
            href="/me/reports"
            className="inline-flex w-9 h-9 -ml-2 items-center justify-center rounded-md text-fg-light hover:bg-surface-card transition-colors no-select"
            aria-label="보고서로"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <p className="mt-5 text-xs font-medium text-fg-light-soft">
            소명일기 누적 · {entries.length}개
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
            내 일기 모음
          </h1>
          <p className="mt-2 text-xs text-fg-light-muted">
            🔒 본인만 봅니다.
          </p>
        </header>

        {error ? (
          <p className="mx-6 mt-6 text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
            {error.message}
          </p>
        ) : null}

        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="flex-1 px-6 py-6 flex flex-col gap-4">
            {entries.map((entry, idx) => (
              <EntryCard key={entry.id} entry={entry} delayIdx={idx} />
            ))}
          </section>
        )}

        <section className="px-6 pb-10 pt-2 flex flex-col gap-3">
          <Link
            href="/me/diary/new"
            className="w-full py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold text-center transition-colors"
          >
            오늘 일기 쓰기
          </Link>
        </section>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6 py-12 animate-fade-up">
      <div className="text-4xl">📔</div>
      <h2 className="text-lg font-bold">아직 일기가 없어요</h2>
      <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
        오늘 퇴근 보고를 paste하면
        <br />이 자리에 첫 일기가 쌓여요.
      </p>
    </section>
  );
}

function EntryCard({ entry, delayIdx }: { entry: Entry; delayIdx: number }) {
  const delayClass =
    delayIdx === 0
      ? "animate-fade-up-delay-1"
      : delayIdx === 1
        ? "animate-fade-up-delay-2"
        : "animate-fade-up-delay-3";
  const relative = formatRelative(entry.entry_date);
  return (
    <article
      className={`p-4 rounded-[12px] border border-border-line bg-surface-paper ${delayClass}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-fg-light">
          {formatDate(entry.entry_date)}
        </p>
        <span className="text-[11px] text-fg-light-muted">{relative}</span>
      </div>

      {entry.ai_question ? (
        <div className="mb-3">
          {entry.ai_question_source ? (
            <p className="text-[10px] font-semibold text-purple-deep mb-1 tracking-wide">
              {entry.ai_question_source}
            </p>
          ) : null}
          <div
            className="text-xs text-fg-light-soft leading-relaxed line-clamp-3"
            dangerouslySetInnerHTML={{ __html: entry.ai_question }}
          />
        </div>
      ) : null}

      {entry.answer ? (
        <div className="mb-2 pl-3 border-l-2 border-brand-200">
          <p className="text-[10px] font-semibold text-brand-600 mb-1">답</p>
          <p className="text-sm text-fg-light leading-relaxed whitespace-pre-wrap">
            {entry.answer}
          </p>
        </div>
      ) : null}

      {entry.free_note ? (
        <div className="pl-3 border-l-2 border-border-line">
          <p className="text-[10px] font-semibold text-fg-light-muted mb-1">
            자유
          </p>
          <p className="text-sm text-fg-light-soft leading-relaxed whitespace-pre-wrap">
            {entry.free_note}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} (${weekday})`;
}

function formatRelative(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}달 전`;
}
