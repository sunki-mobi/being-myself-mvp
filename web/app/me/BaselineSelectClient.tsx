"use client";

import { useRouter } from "next/navigation";

/**
 * /me — baseline이 아직 없는 사용자에게 보이는 진입 카드.
 *
 * 두 갈래:
 *   1. 처음 시작 — 15분 음성 셀프인터뷰 (Phase 3b)
 *   2. 이미 자료 있음 — 풀텍스트 paste + LLM 파싱 (Phase 3c)
 */
export function BaselineSelectClient({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const router = useRouter();

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
              {displayName}님, 반가워요
            </p>
            <h1 className="text-3xl font-bold leading-tight">
              먼저 나를 알아가는
              <br />
              <span className="font-extrabold">셀프인터뷰</span>로 시작해요
            </h1>
            <p className="mt-3 text-sm text-fg-dark-soft leading-relaxed">
              내 좋아하는 것·잘하는 것·가치 있는 것을 정리하면
              <br />
              매일의 답변이 거기에 쌓이기 시작해요.
            </p>
          </div>
        </header>

        {/* Body — 두 카드 */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {/* 카드 1 — 처음 시작 */}
          <article
            className="p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer animate-fade-up-delay-1"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
            }}
            onClick={() => router.push("/me/baseline/interview")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/me/baseline/interview");
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-3">
                  #처음 시작 · 약 15분
                </span>
                <h2 className="text-xl font-bold text-fg-light mb-2 leading-snug">
                  음성으로 셀프인터뷰 시작
                </h2>
                <p className="text-xs text-fg-light/70 leading-relaxed">
                  객관식 + 음성 답변으로 진행되고, 도중에 멈춰도
                  <br />
                  다음에 이어서 할 수 있어요.
                </p>
              </div>
              <span aria-hidden className="text-2xl text-fg-light/70 mt-1">
                →
              </span>
            </div>
          </article>

          {/* 카드 2 — Import */}
          <article
            className="p-6 rounded-3xl bg-surface-dark text-fg-dark shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer animate-fade-up-delay-2"
            onClick={() => router.push("/me/baseline/import")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/me/baseline/import");
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-brand-500/30 text-[10px] font-semibold text-brand-100 tracking-wide mb-3">
                  이미 자료 있음
                </span>
                <h2 className="text-xl font-bold mb-2 leading-snug">
                  기존 인터뷰 자료 가져오기
                </h2>
                <p className="text-xs text-fg-dark-soft leading-relaxed">
                  이미 작성한 셀프인터뷰 텍스트가 있다면
                  <br />
                  통째로 붙여넣어 보고서로 변환할 수 있어요.
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
