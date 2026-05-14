"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import {
  PREPARE_STEPS,
  TOTAL_PREPARE_STEPS,
  type StepConfig,
} from "@/lib/me/prepare-steps";

/**
 * Prepare 4-step 안내 화면 — /demo/prepare(deprecated)와 /me/baseline/prepare에서 재사용.
 *
 * Step 1~3은 자체적으로 다음 step으로 push. Step 4 (TOTAL_PREPARE_STEPS) CTA는
 * `onComplete` 호출 → 호출부가 prepare_seen 마킹·다음 화면 진입 등 처리.
 */
export function PrepareStage({
  step,
  onBack,
  onNext,
  onComplete,
  completeCtaLoading = false,
}: {
  step: number;
  /** 일반 뒤로 가기 (예: 첫 step에서 / 또는 /me로). step > 1 자체 처리는 PrepareStage 내부에 없음. */
  onBack: () => void;
  /** step 1~3에서 다음 step으로 진입할 때 호출 — 호출부가 router.push 처리 */
  onNext: () => void;
  /** 마지막 step CTA 클릭 시 호출 — prepare_seen 마킹 + 다음 화면으로 */
  onComplete: () => void;
  /** 마지막 step 완료 비동기 처리 중일 때 CTA 비활성·로딩 표시 */
  completeCtaLoading?: boolean;
}) {
  if (step < 1 || step > TOTAL_PREPARE_STEPS) return null;
  const config: StepConfig = PREPARE_STEPS[step - 1];
  const isLast = step === TOTAL_PREPARE_STEPS;

  function handleCta() {
    if (isLast) onComplete();
    else onNext();
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        <header className="px-6 pt-8 animate-fade-up">
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로 가기"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-md text-fg-light hover:bg-surface-card active:bg-surface-card transition-colors no-select"
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

          <ProgressBar step={step} total={TOTAL_PREPARE_STEPS} />
        </header>

        <section className="flex-1 flex flex-col px-6 pt-10 pb-8">
          <h1
            key={`title-${step}`}
            className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light animate-fade-up-delay-1"
          >
            {config.title.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className="flex-1 flex items-center justify-center my-8 animate-fade-up-delay-2">
            <Image
              src={config.illustration}
              alt={config.illustrationAlt}
              width={220}
              height={180}
              priority
              className="max-w-[220px] w-full h-auto"
            />
          </div>

          <div className="text-[13.5px] leading-[1.8] text-fg-light-soft animate-fade-up-delay-3">
            <p className="font-bold text-fg-light">{config.description.bold}</p>
            {config.description.rest.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>

        <CTAButton
          onClick={handleCta}
          disabled={isLast && completeCtaLoading}
        >
          {isLast && completeCtaLoading ? "준비 중…" : config.cta}
        </CTAButton>
      </div>
    </main>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const target = (step / total) * 100;
  const prev = ((step - 1) / total) * 100;
  const [width, setWidth] = useState(prev);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="mt-5">
      <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C6D5F5] transition-[width] duration-300 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-right text-xs text-fg-light-soft mt-1.5">
        {step}/{total}
      </p>
    </div>
  );
}

function CTAButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative w-full py-5 bg-[#DCE7F7] hover:brightness-95 active:brightness-90 text-fg-light text-base font-semibold transition-[filter] no-select lg:rounded-b-3xl disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="block text-center">{children}</span>
      <span
        aria-hidden
        className="absolute right-6 top-1/2 -translate-y-1/2 text-fg-light"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </button>
  );
}
