"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@/lib/conversation";
import { BASELINE_REPORT } from "@/lib/me/baseline-report";

/**
 * /me landing — client island.
 *
 * Server component(`page.tsx`)에서 displayName·email 주입받음. 기존 LocalStorage
 * 기반 `useConversation` 그대로 사용 (Phase 2에서 server-backed로 교체).
 */
export function MeLandingClient({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const router = useRouter();
  const { state, hydrated, login } = useConversation();

  // 로그인 사용자명으로 useConversation user를 세팅 (LocalStorage 헤더 표시용)
  useEffect(() => {
    if (hydrated && state.userName !== displayName) {
      login(displayName);
    }
  }, [hydrated, state.userName, displayName, login]);

  if (!hydrated) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const hasOngoing = state.messages.length > 0;
  const answeredCount = state.messages.filter(
    (m) => m.role === "user-answer",
  ).length;
  const partsCount = BASELINE_REPORT.parts.length;

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Dark hero */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-14 rounded-b-[2rem] relative overflow-hidden animate-fade-up">
          {/* 로그아웃 — 우상단 */}
          <form action="/auth/sign-out" method="POST" className="absolute top-4 right-4">
            <button
              type="submit"
              aria-label="로그아웃"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              title="로그아웃"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-fg-dark-soft"
                aria-hidden
              >
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-xs text-fg-dark-soft mb-2">
                {displayName}님, 안녕하세요
              </p>
              <h1 className="text-3xl font-bold leading-tight">
                나에게 집중하는 시간,
                <br />
                <span className="font-extrabold">Being myself</span>
              </h1>
              <p className="mt-3 text-xs text-fg-dark-soft">
                하루 5분, 두 개의 질문이 보고서에 쌓여요.
              </p>
            </div>
            <div className="w-20 h-20 flex-shrink-0" />
          </div>
        </header>

        {/* Body */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {/* 오늘의 셀프인터뷰 카드 */}
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
                  #셀프인터뷰 · 오늘
                </span>
                <h2 className="text-xl font-bold text-fg-light mb-2 leading-snug">
                  {hasOngoing ? "이어서 답변하기" : "오늘의 두 질문에 답하기"}
                </h2>
                <p className="text-xs text-fg-light/70 leading-relaxed">
                  {hasOngoing
                    ? `${answeredCount}개 답변 누적 · 진행 중`
                    : "두 가지 질문에 답하면 보고서가 쌓여요. 5분이면 충분해요."}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </article>

          {/* 내 보고서 카드 */}
          <article
            className="p-6 rounded-3xl bg-surface-dark text-fg-dark shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer animate-fade-up-delay-2"
            onClick={() => router.push("/me/report")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/me/report");
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-brand-500/30 text-[10px] font-semibold text-brand-100 tracking-wide mb-3">
                  내 보고서
                </span>
                <h2 className="text-xl font-bold mb-2 leading-snug">
                  {displayName}님의
                  <br />
                  셀프인터뷰 보고서
                </h2>
                <p className="text-xs text-fg-dark-soft leading-relaxed">
                  {partsCount}개 Part로 정리된 나의 모습
                  {answeredCount > 0 ? ` · 오늘 답변 ${answeredCount}개 추가` : ""}
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-dark-soft mt-1">
                →
              </span>
            </div>
          </article>

          <p className="text-center text-xs text-fg-light-soft mt-auto pt-6">
            {email ? `${email} · ` : ""}© 2026 MOBINITY. All Rights Reserved.
          </p>
        </section>
      </div>
    </main>
  );
}
