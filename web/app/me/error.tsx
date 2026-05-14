"use client";

/**
 * /me/* 라우트 전역 에러 경계.
 *
 * Server component throw / RSC render 실패 / 클라이언트 hydration 에러를
 * 잡아 사용자 친화적 한국어 메시지로 대체. 자식 segment(conversation,
 * diary, reports, baseline 등)에 더 구체적 error.tsx가 없으면 여기서 잡음.
 *
 * 표시 톤은 loading.tsx와 동일한 카드 레이아웃. 사용자에게 raw error를
 * 보이지 말 것 — 디버깅은 console + 추후 Sentry.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function MeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/me] route error", error);
  }, [error]);

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 items-center justify-center gap-6 text-center">
        <div
          aria-hidden
          className="w-14 h-14 rounded-full flex items-center justify-center bg-brand-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 text-brand-500"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-bold text-fg-light tracking-[-0.01em]">
            잠시 멈췄어요
          </h1>
          <p className="text-sm text-fg-light-soft leading-relaxed">
            화면을 불러오는 중에 문제가 생겼어요.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>
        </div>

        {error?.digest ? (
          <p className="text-[11px] font-mono text-fg-light-muted">
            ref: {error.digest}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            type="button"
            onClick={reset}
            className="w-full py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform"
          >
            다시 시도
          </button>
          <Link
            href="/me"
            className="w-full py-3 rounded-2xl border border-border-line text-fg-light text-sm font-semibold text-center bg-surface-paper active:scale-[0.99] transition-transform"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
