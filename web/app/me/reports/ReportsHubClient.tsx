"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * /me/reports hub — 누적된 본인 데이터 모음.
 */
export function ReportsHubClient({
  displayName,
  qaCount,
  diaryCount,
}: {
  displayName: string;
  qaCount: number;
  diaryCount: number;
}) {
  const router = useRouter();

  const cards: {
    key: string;
    badge: string;
    title: string;
    sub: string;
    href: string;
    variant: "purple" | "dark" | "neutral";
  }[] = [
    {
      key: "baseline",
      badge: "# 셀프인터뷰",
      title: "셀프인터뷰 보고서",
      sub: "좋아하는 · 잘하는 · 가치 있는 것 3 Part",
      href: "/me/report/full",
      variant: "purple",
    },
    {
      key: "long-term",
      badge: "# 누적",
      title: "지금까지의 모습",
      sub: "현상 · 본질 · 가치 · 존재 4단계",
      href: "/me/long-term",
      variant: "dark",
    },
    {
      key: "daily",
      badge: "# 매일 · 디제스트",
      title: "매일 두 질문 보고서",
      sub:
        qaCount > 0 ? `${qaCount}개 답변 누적` : "오늘 답변하면 디제스트가 만들어져요.",
      href: "/me/report",
      variant: "neutral",
    },
    {
      key: "diary",
      badge: "# 소명일기 · 누적",
      title: "내 일기 모음",
      sub:
        diaryCount > 0
          ? `${diaryCount}개 일기 누적`
          : "오늘부터 일기 쓰면 여기에 쌓여요.",
      href: "/me/diary",
      variant: "neutral",
    },
  ];

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <header className="px-6 pt-10 pb-2 animate-fade-up">
          <button
            type="button"
            onClick={() => router.push("/me")}
            aria-label="홈으로"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-md text-fg-light hover:bg-surface-card transition-colors no-select"
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
          </button>
          <p className="mt-5 text-xs font-medium text-fg-light-soft">
            {displayName}님의 보고서
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
            지금까지 쌓인 내 모습
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-4">
          {cards.map((c, idx) => (
            <Link
              key={c.key}
              href={c.href}
              prefetch
              className={`${variantClass(
                c.variant,
              )} block p-5 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all animate-fade-up-delay-${
                Math.min(idx, 3) + 1
              }`}
              style={
                c.variant === "purple"
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide mb-2 ${badgeClass(
                      c.variant,
                    )}`}
                  >
                    {c.badge}
                  </span>
                  <h2 className={`text-base font-bold leading-snug mb-1 ${titleClass(c.variant)}`}>
                    {c.title}
                  </h2>
                  <p className={`text-xs leading-relaxed ${subClass(c.variant)}`}>
                    {c.sub}
                  </p>
                </div>
                <span aria-hidden className={`text-xl mt-1 ${subClass(c.variant)}`}>
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function variantClass(v: "purple" | "dark" | "neutral"): string {
  switch (v) {
    case "purple":
      return "";
    case "dark":
      return "bg-surface-dark text-fg-dark";
    case "neutral":
      return "border border-border-line bg-surface-paper";
  }
}

function badgeClass(v: "purple" | "dark" | "neutral"): string {
  switch (v) {
    case "purple":
      return "bg-white/60 text-fg-light";
    case "dark":
      return "bg-brand-500/30 text-brand-100";
    case "neutral":
      return "bg-selected-bg text-purple-deep";
  }
}

function titleClass(v: "purple" | "dark" | "neutral"): string {
  return v === "dark" ? "text-fg-dark" : "text-fg-light";
}

function subClass(v: "purple" | "dark" | "neutral"): string {
  return v === "dark" ? "text-fg-dark-soft" : "text-fg-light-soft";
}
