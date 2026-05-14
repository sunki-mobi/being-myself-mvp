"use client";

import { useEffect } from "react";
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
            짧은 호흡 하나로 시작해요
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {/* 매일의 두 질문 */}
          <article
            className="p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer animate-fade-up-delay-1"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
            }}
            onClick={() => router.push("/me/conversation")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/me/conversation");
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-3">
                  # 매일 · 5분
                </span>
                <h2 className="text-lg font-bold text-fg-light mb-2 leading-snug">
                  {hasOngoing ? "이어서 답변하기" : "오늘의 두 질문에 답하기"}
                </h2>
                <p className="text-xs text-fg-light/70 leading-relaxed">
                  {hasOngoing
                    ? `${answeredCount}개 답변 누적 · 진행 중`
                    : "두 가지 질문에 답하면 보고서가 쌓여요."}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </article>

          {/* 소명일기 */}
          <article
            className="p-6 rounded-3xl border border-border-line bg-surface-paper shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer animate-fade-up-delay-2"
            onClick={() =>
              router.push(hasTodayDiary ? "/me/diary" : "/me/diary/new")
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(hasTodayDiary ? "/me/diary" : "/me/diary/new");
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-selected-bg text-[10px] font-semibold text-purple-deep tracking-wide mb-3">
                  # 매일 저녁 · 5분
                </span>
                <h2 className="text-lg font-bold text-fg-light mb-2 leading-snug">
                  {hasTodayDiary
                    ? "오늘 일기 다시 보기"
                    : "소명일기 쓰기"}
                </h2>
                <p className="text-xs text-fg-light-soft leading-relaxed">
                  {hasTodayDiary
                    ? "오늘 작성한 일기가 있어요."
                    : "퇴근 보고를 붙여넣으면 AI가 오늘 한 일의 의미를 정리해줘요."}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light-soft mt-1">
                →
              </span>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
