"use client";

import Link from "next/link";

/**
 * S-00 스플래시 / 표지.
 *
 * 박람회(2026-05-12) 이후 본 서비스 중심으로 weight 재조정:
 *   - "시작하기" → /me  (primary, brand-500 큰 버튼)
 *   - "게스트 데모 살펴보기" → /demo  (푸터 위 작은 텍스트 링크)
 *
 * /demo는 잠재 고객 시연용으로 유지하되 본 서비스 진입을 가리지 않도록
 * weight를 확 낮춤. 박람회 부스 iPad는 /demo 직접 북마크라 이 표지를
 * 거치지 않으니 영향 없음.
 */
export default function LandingPage() {
  return (
    <main
      className="min-h-screen w-full flex justify-center bg-[#050210]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #1a1235 0%, #050210 70%)",
      }}
    >
      <div
        className="w-full max-w-md flex flex-col gradient-hero text-fg-dark lg:rounded-3xl lg:my-8 lg:min-h-[820px] relative overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -20px rgba(140, 82, 255, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04)",
        }}
      >
        {/* 보라 그라데이션 ambient — hero 톤 강화 */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--brand-500) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 -left-32 w-80 h-80 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--grad-stop-3) 0%, transparent 70%)",
          }}
        />

        {/* 본문 */}
        <section className="relative flex-1 flex flex-col px-6 pt-16 pb-10">
          {/* Hero 텍스트 */}
          <div className="animate-fade-up">
            <p className="mt-6 text-base text-fg-dark-soft leading-relaxed">
              하루 5분, 나에게 집중하는 시간
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Being
              <br />
              myself
            </h1>
            <p className="mt-6 text-base text-fg-dark-soft leading-relaxed">
              두 가지 질문에 답하면
              <br />
              보고서가 쌓여요. 매일 5분으로
              <br />
              나의 소명을 발견해보세요.
            </p>
          </div>

          {/* Hero 일러스트 — 디자인 시스템 v0.1 (boras·민트 카드 stack). */}
          <div className="flex-1 min-h-[12rem] flex items-center justify-center animate-fade-up-delay-1">
            {/* <Image
              src="/img/cover-hero.png"
              alt=""
              width={236}
              height={236}
              priority
              className="w-full max-w-[260px] h-auto"
            /> */}
          </div>


          {/* 진입 — 본 서비스 중심 */}
          <div className="animate-fade-up-delay-2">
            <Link
              href="/me"
              className="block w-full px-6 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] transition-all text-center shadow-lg shadow-brand-500/20"
            >
              <span className="block text-base font-semibold text-white">
                시작하기
              </span>
              <span className="block text-xs text-white/70 mt-0.5">
                회원가입 · 로그인
              </span>
            </Link>
          </div>

          {/* 데모 — weight 낮춘 텍스트 링크 */}
          <p className="text-center mt-6 animate-fade-up-delay-3">
            <Link
              href="/demo"
              className="text-xs text-fg-dark-soft/70 hover:text-fg-dark-soft underline-offset-4 hover:underline transition-colors"
            >
              게스트 데모 살펴보기 →
            </Link>
          </p>

          <p className="text-center text-[11px] text-fg-dark-soft/50 mt-8 animate-fade-up-delay-3">
            © 2026 MOBINITY. All Rights Reserved.
          </p>
        </section>
      </div>
    </main>
  );
}
