"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * S-00 스플래시 / 표지 (기획안 §6.2 기준).
 *
 * 다크 보라 hero가 화면을 가득 채우는 표지 톤. Being Myself 로고 + 슬로건 +
 * 두 진입 버튼:
 *   - "체험해보기 (게스트)" → /demo  (박람회 방문자)
 *   - "내 데이터로 시작 (로그인)" → /me  (모비니티 내부 구성원 / 본인 시연)
 *
 * 박람회 부스 iPad는 /demo에 직접 북마크되어 있으니 이 표지는:
 *   - 일반 방문자가 URL 직접 접근 시 첫 인상
 *   - 운영자가 "본 서비스 보여드릴게요" 할 때 두 트랙 모두 같은 표지에서 분기
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-dark lg:bg-gradient-to-b lg:from-surface-dark lg:to-[#1a1235]">
      <div className="w-full max-w-md flex flex-col gradient-hero text-fg-dark lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-2xl lg:shadow-black/40 relative">
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


          {/* 진입 버튼 — 두 트랙 */}
          <div className="flex flex-col gap-3 animate-fade-up-delay-2">
            <Link
              href="/demo"
              className="block w-full px-6 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] transition-all text-center"
            >
              <span className="block text-base font-semibold text-white">
                체험해보기
              </span>
              <span className="block text-xs text-white/70 mt-0.5">
                게스트 · 5분 데모
              </span>
            </Link>

            <Link
              href="/me"
              className="block w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 active:scale-[0.99] transition-all text-center"
            >
              <span className="block text-base font-semibold text-fg-dark">
                내 데이터로 시작
              </span>
              <span className="block text-xs text-fg-dark-soft mt-0.5">
                회원가입 · 로그인
              </span>
            </Link>
          </div>

          <p className="text-center text-xs text-fg-dark-soft/60 mt-8 animate-fade-up-delay-3">
            © 2026 MOBINITY. All Rights Reserved.
          </p>
        </section>
      </div>
    </main>
  );
}
