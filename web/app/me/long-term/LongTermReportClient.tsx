"use client";

import { useRouter } from "next/navigation";
import type {
  LongTermLayerCard,
  LongTermReport,
} from "@/lib/me/long-term-report";

/**
 * /me/long-term renderer — 4단계(현상·본질·가치·존재) 누적 보고서.
 *
 * baseline + qa_pair 누적으로 합성된 LongTermReport를 받아 hero + 키워드 +
 * 4 layer 카드로 표시. 누적이 늘어날수록 내용이 풍부해짐.
 */
export function LongTermReportClient({
  report,
}: {
  report: LongTermReport;
}) {
  const router = useRouter();
  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Hero */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-10 rounded-b-[2rem] relative animate-fade-up">
          <button
            type="button"
            onClick={() => router.push("/me")}
            aria-label="홈으로"
            className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
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
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <p className="text-xs font-medium text-fg-dark-soft mb-3 mt-2">
            {report.userName}님 · 지금까지의 모습
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-fg-dark-soft">내가 진정 하고 싶은 일은</span>
            <br />
            <span className="text-fg-dark">{report.headline}</span>
            <br />
            <span className="text-fg-dark-soft">이라고 합니다.</span>
          </h1>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {report.keywords.map((k, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-white/15 text-xs text-fg-dark backdrop-blur-sm"
              >
                #{k}
              </span>
            ))}
          </div>

          <p className="mt-5 text-[11px] text-fg-dark-soft tracking-wide">
            {report.daySpan}일 누적 · 답변 {report.totalAnswers}개
          </p>
        </header>

        {/* 4 layer */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {report.layers.map((card, idx) => (
            <LayerCard key={card.layer} card={card} delayIdx={idx} />
          ))}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/me")}
            className="w-full px-6 py-3 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </section>
      </div>
    </main>
  );
}

function LayerCard({
  card,
  delayIdx,
}: {
  card: LongTermLayerCard;
  delayIdx: number;
}) {
  const delayClass =
    delayIdx === 0
      ? "animate-fade-up-delay-1"
      : delayIdx === 1
        ? "animate-fade-up-delay-2"
        : "animate-fade-up-delay-3";
  return (
    <article
      className={`p-5 rounded-[12px] bg-surface-paper border border-border-line shadow-card ${delayClass}`}
    >
      <div className="flex items-baseline gap-2 mb-3">
        <span className="inline-block px-2 py-0.5 rounded-full bg-selected-bg text-[10px] font-semibold text-purple-deep tracking-wide">
          {card.layer}
        </span>
        <h2 className="text-base font-bold text-fg-light">
          {card.friendlyTitle}
        </h2>
      </div>

      <p className="text-sm text-fg-light leading-relaxed mb-4">
        {card.summary}
      </p>

      {card.quotes.length > 0 ? (
        <div className="space-y-3 mb-4">
          {card.quotes.map((q, i) => (
            <div key={i} className="pl-3 border-l-2 border-purple">
              <p className="text-[10px] font-semibold text-purple-deep mb-1 tracking-wide">
                Day {q.day}
              </p>
              <p className="text-sm text-fg-light/90 leading-relaxed italic">
                &ldquo;{q.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 px-3 py-2 rounded-[8px] bg-[#f6f4fb] text-xs text-fg-light-muted leading-relaxed">
          답변이 쌓일수록 이 자리에 사용자님 표현이 들어와요.
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border-line-soft">
        {card.keywords.map((k, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full bg-selected-bg text-[11px] text-purple-deep"
          >
            #{k}
          </span>
        ))}
      </div>
    </article>
  );
}
