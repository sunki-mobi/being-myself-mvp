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
    bgImage: string;
    textTone: "light" | "dark";
  }[] = [
    {
      key: "baseline",
      badge: "# 셀프인터뷰",
      title: "셀프인터뷰 보고서",
      sub: "좋아하는 · 잘하는 · 가치 있는 것 3 Part",
      href: "/me/report/full",
      bgImage: "/img/list/iridescent.svg",
      textTone: "dark",
    },
    {
      key: "long-term",
      badge: "# 누적",
      title: "지금까지의 모습",
      sub: "쌓인 답변에서 자라난 큰 그림",
      href: "/me/long-term",
      bgImage: "/img/list/navy.svg",
      textTone: "light",
    },
    {
      key: "daily",
      badge: "# 매일 · 디제스트",
      title: "오늘의 답변",
      sub:
        qaCount > 0
          ? `${qaCount}개 답변 · 오늘의 정리 보기`
          : "오늘 두 질문에 답하면 정리해드려요",
      href: "/me/report",
      bgImage: "/img/list/dawn.svg",
      textTone: "dark",
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
      bgImage: "/img/list/cream.svg",
      textTone: "dark",
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

        <section className="flex-1 px-6 py-8 flex flex-col gap-1.5">
          {cards.map((c, idx) => (
            <Link
              key={c.key}
              href={c.href}
              prefetch
              className={`relative block no-select active:scale-[0.99] transition-transform animate-fade-up-delay-${
                Math.min(idx, 3) + 1
              }`}
              style={{
                // 검증된 padding/minHeight — 사용자가 "맞는 디자인"이라 확정.
                padding: "20px 32px 22px 28px",
                backgroundImage: `url('${c.bgImage}')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundColor: "transparent",
                minHeight: 132,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide mb-1.5 ${badgeClass(
                      c.textTone,
                    )}`}
                  >
                    {c.badge}
                  </span>
                  <h2
                    className={`text-base font-bold leading-snug mb-0.5 ${titleClass(
                      c.textTone,
                    )}`}
                  >
                    {c.title}
                  </h2>
                  <p
                    className={`text-xs leading-relaxed truncate ${subClass(
                      c.textTone,
                    )}`}
                  >
                    {c.sub}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`text-xl mt-1 ${subClass(c.textTone)}`}
                >
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

function badgeClass(tone: "light" | "dark"): string {
  return tone === "light"
    ? "bg-white/15 text-white"
    : "bg-white/60 text-fg-light";
}

function titleClass(tone: "light" | "dark"): string {
  return tone === "light" ? "text-white" : "text-fg-light";
}

function subClass(tone: "light" | "dark"): string {
  return tone === "light" ? "text-white/80" : "text-fg-light/75";
}
