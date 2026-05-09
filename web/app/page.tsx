"use client";

import Link from "next/link";
import { StageContainer } from "@/components/StageContainer";

/**
 * NEW / — 트랙 선택 splash
 *
 * 두 가지 진입점을 제공:
 *   1. /demo  — 박람회 게스트 데모 (페르소나 기반, 5분 종단 경험)
 *   2. /me    — 본인 데이터로 시작 (Phase B — 자유 텍스트 대화 + 누적 보고서)
 *
 * 박람회 운영자는 부스 태블릿을 /demo에 직접 북마크해두고 사용,
 * 본인 시연/내부 사용자는 /me 트랙을 사용.
 * 어떤 사람이 박람회 후에도 둘러보고 싶을 때를 위해 진입점 자체를 분리.
 */
export default function LandingPage() {
  return (
    <StageContainer variant="light">
      {/* Brand */}
      <section className="mb-10 mt-4 animate-fade-up">
        <p className="text-sm text-fg-light-soft mb-2">
          하루 15분, 나에게 집중하는 시간
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Being myself
        </h1>
        <p className="mt-3 text-sm text-fg-light-soft">
          어떻게 시작하시겠어요?
        </p>
      </section>

      {/* Track cards */}
      <section className="flex-1 flex flex-col gap-4">
        {/* Demo track */}
        <Link
          href="/demo"
          className="block p-6 rounded-3xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all no-select animate-fade-up-delay-1"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-3">
                DEMO
              </div>
              <div className="text-xl font-semibold text-fg-light mb-1">
                박람회 게스트 데모
              </div>
              <div className="text-sm text-fg-light/80 leading-relaxed">
                3 페르소나 중 하나를 골라
                <br />5 분 안에 짧게 체험해보기
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/legacy/image (12).png"
              alt=""
              aria-hidden
              className="w-20 h-20 object-contain flex-shrink-0"
            />
          </div>
        </Link>

        {/* Me track — Phase B */}
        <Link
          href="/me"
          className="block p-6 rounded-3xl bg-surface-dark text-fg-dark shadow-sm hover:shadow-md active:scale-[0.99] transition-all no-select animate-fade-up-delay-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="inline-block px-2 py-0.5 rounded-full bg-brand-500/30 text-[10px] font-semibold text-brand-100 tracking-wide mb-3">
                ORIGINAL
              </div>
              <div className="text-xl font-semibold mb-1">
                내 데이터로 시작하기
              </div>
              <div className="text-sm text-fg-dark-soft leading-relaxed">
                나의 셀프인터뷰를 기반으로
                <br />AI 페이스메이커와 깊은 대화
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/legacy/image (9).png"
              alt=""
              aria-hidden
              className="w-20 h-20 object-contain flex-shrink-0 invert opacity-90"
            />
          </div>
        </Link>
      </section>

      <p className="text-center text-xs text-fg-light-soft mt-8">
        Being Myself MVP · 모비니티 온톨로지
      </p>
    </StageContainer>
  );
}
