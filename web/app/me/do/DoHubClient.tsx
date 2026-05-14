"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConversation } from "@/lib/conversation";

/**
 * /me/do hub — 오늘 할 수 있는 일들.
 *
 * 카드:
 *  - 매일의 두 질문 (/me/conversation) — 진행 중이면 카운트 표시
 *  - 소명일기 (/me/diary/new 또는 /me/diary 오늘 entry)
 */
export function DoHubClient({
  displayName,
  hasTodayDiary,
}: {
  displayName: string;
  hasTodayDiary: boolean;
}) {
  const router = useRouter();
  const { state, hydrated, login } = useConversation();

  // 로그인 사용자명 LocalStorage 세팅 (다른 페이지 의존성)
  useEffect(() => {
    if (hydrated && state.userName !== displayName) {
      login(displayName);
    }
  }, [hydrated, state.userName, displayName, login]);

  const hasOngoing = hydrated && state.messages.length > 0;
  const answeredCount = state.messages.filter(
    (m) => m.role === "user-answer",
  ).length;

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* 헤더 — 간소화 */}
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
            오늘 할 수 있는 일
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
            오늘 무엇을 시작해 볼까요?
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-3">
          {/* 매일의 두 질문 — lavender-purple (강조 보라, 흰 글씨) */}
          <Link
            href="/me/conversation"
            prefetch
            className="relative block no-select animate-fade-up-delay-1"
            style={{
              display: "block",
              width: "100%",
              padding: "20px 32px 22px 28px",
              backgroundImage: "url('/img/list/iridescent.svg')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundColor: "transparent",
              minHeight: 132,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-purple-deep tracking-wide mb-3">
                  # 매일 · 5분
                </span>
                <h2 className="text-lg font-bold text-fg-light mb-2 leading-snug">
                  Being myself
                </h2>
                <p className="text-xs text-fg-light/80 leading-relaxed">
                  {hasOngoing
                    ? `오늘의 두 질문 · ${answeredCount}개 답변 누적 · 진행 중`
                    : "오늘의 두 질문에 답하면 보고서가 쌓여요. 5분이면 충분해요."}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </Link>

          {/* 소명일기 — mint-deep (mint, dark 글씨) */}
          <Link
            href={hasTodayDiary ? "/me/diary" : "/me/diary/new"}
            prefetch
            className="relative block no-select animate-fade-up-delay-2"
            style={{
              display: "block",
              width: "100%",
              padding: "20px 32px 22px 28px",
              backgroundImage: "url('/img/list/dawn.svg')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundColor: "transparent",
              minHeight: 132,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-3">
                  # 매일 저녁 · 5분
                </span>
                <h2 className="text-lg font-bold text-fg-light mb-2 leading-snug">
                  {hasTodayDiary
                    ? "오늘 일기 다시 보기"
                    : "소명일기 쓰기"}
                </h2>
                <p className="text-xs text-fg-light/80 leading-relaxed">
                  {hasTodayDiary
                    ? "오늘 작성한 일기가 있어요."
                    : "퇴근 보고를 붙여넣으면 AI가 오늘 한 일의 의미를 정리해줘요."}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
