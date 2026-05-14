"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConversation } from "@/lib/conversation";

/**
 * /me landing — simplified home.
 *
 * 두 큰 카드로 IA 분리:
 *  - "오늘 할 일" → /me/do (매일 두 질문, 소명일기)
 *  - "내 보고서"  → /me/reports (셀프인터뷰·4단계 누적·소명일기 누적)
 *
 * useConversation login 호출은 유지 — 다른 페이지(/me/conversation 등)가
 * LocalStorage의 userName에 의존하기 때문.
 */
export function MeLandingClient({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const { state, hydrated, login } = useConversation();

  useEffect(() => {
    if (hydrated && state.userName !== displayName) {
      login(displayName);
    }
  }, [hydrated, state.userName, displayName, login]);

  if (!hydrated) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Dark hero */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-14 rounded-b-[2rem] relative overflow-hidden animate-fade-up">
          <form
            action="/auth/sign-out"
            method="POST"
            className="absolute top-4 right-4"
          >
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

          <div>
            <p className="text-xs text-fg-dark-soft mb-2">
              {displayName}님, 안녕하세요
            </p>
            <h1 className="text-3xl font-bold leading-tight">
              나에게 집중하는 시간,
              <br />
              <span className="font-extrabold">Being myself</span>
            </h1>
            <p className="mt-3 text-xs text-fg-dark-soft">
              오늘 할 수 있는 일과 지금까지의 내 모습을 둘러봐요.
            </p>
          </div>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {/* 오늘 할 일 */}
          <Link
            href="/me/do"
            prefetch
            className="block p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all animate-fade-up-delay-1"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-3">
                  # 오늘
                </span>
                <h2 className="text-xl font-bold text-fg-light mb-2 leading-snug">
                  오늘 할 일
                </h2>
                <p className="text-xs text-fg-light/70 leading-relaxed">
                  매일의 두 질문 · 소명일기
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </Link>

          {/* 내 보고서 */}
          <Link
            href="/me/reports"
            prefetch
            className="block p-6 rounded-3xl bg-surface-dark text-fg-dark shadow-sm hover:shadow-md active:scale-[0.99] transition-all animate-fade-up-delay-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-brand-500/30 text-[10px] font-semibold text-brand-100 tracking-wide mb-3">
                  # 내 모습
                </span>
                <h2 className="text-xl font-bold mb-2 leading-snug">
                  내 보고서
                </h2>
                <p className="text-xs text-fg-dark-soft leading-relaxed">
                  셀프인터뷰 보고서 · 4단계 누적 · 소명일기 누적
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-dark-soft mt-1">
                →
              </span>
            </div>
          </Link>

          <p className="text-center text-xs text-fg-light-soft mt-auto pt-6">
            {email ? `${email} · ` : ""}© 2026 MOBINITY. All Rights Reserved.
          </p>
        </section>
      </div>
    </main>
  );
}
