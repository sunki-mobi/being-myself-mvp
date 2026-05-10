"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getPersona } from "@/lib/personas";
import { getLongTermPreview } from "@/lib/me/long-term-previews";
import type { LongTermLayerCard } from "@/lib/me/long-term-report";

/**
 * /demo/report/full — 페르소나별 6개월 누적 보고서 미리보기.
 *
 * 4단계 층위 양식 (현상·본질·가치·존재). hero에 한 줄 소명 + 키워드 대시보드,
 * 본문에 4 layer 카드. 콘텐츠는 `LONG_TERM_PREVIEWS`의 [TODO] 슬롯 — 박람회
 * 직전에 사용자가 페르소나별로 채움.
 *
 * Design doc: skpan-master-design-20260510-191649.md
 */
export default function DemoReportFullPage() {
  const router = useRouter();
  const { state, hydrated } = useSession();

  const personaId = state.personaId;
  const persona = personaId ? getPersona(personaId) : null;

  useEffect(() => {
    if (hydrated && !personaId) {
      router.replace("/demo");
    }
  }, [hydrated, personaId, router]);

  if (!hydrated || !persona) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const report = getLongTermPreview(persona.baselineId);
  if (!report) {
    // skpan(/me 트랙)이 어쩌다 이 페이지 접근하면 /demo로 — 게스트 트랙 전용
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Hero — 한 줄 소명 + 키워드 대시보드 */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-10 rounded-b-[2rem] relative animate-fade-up">
          <button
            type="button"
            onClick={() => router.push("/demo/report")}
            aria-label="오늘의 보고서로"
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
            {report.userName}님 · 6개월 뒤 모습 미리보기
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-fg-dark-soft">내가 진정 하고 싶은 일은</span>
            <br />
            <span className="text-fg-dark">{report.headline}</span>
            <br />
            <span className="text-fg-dark-soft">이라고 합니다.</span>
          </h1>

          {/* 키워드 대시보드 — 5초 wow */}
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

        {/* 4단계 카드 */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {report.layers.map((card, idx) => (
            <LayerCard key={card.layer} card={card} delayIdx={idx} />
          ))}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/demo/report")}
            className="w-full px-6 py-3 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            오늘의 보고서로 돌아가기
          </button>
        </section>
      </div>
    </main>
  );
}

/* ─────────────────────── Layer card ─────────────────────── */

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
      className={`p-5 rounded-3xl bg-surface-card border border-border-subtle ${delayClass}`}
    >
      <div className="flex items-baseline gap-2 mb-3">
        <span className="inline-block px-2 py-0.5 rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 tracking-wide">
          {card.layer}
        </span>
        <h2 className="text-base font-bold text-fg-light">
          {card.friendlyTitle}
        </h2>
      </div>

      <p className="text-sm text-fg-light leading-relaxed mb-4">
        {card.summary}
      </p>

      <div className="space-y-3 mb-4">
        {card.quotes.map((q, i) => (
          <div key={i} className="pl-3 border-l-2 border-brand-200">
            <p className="text-[10px] font-semibold text-brand-600 mb-1 tracking-wide">
              Day {q.day}
            </p>
            <p className="text-sm text-fg-light/90 leading-relaxed italic">
              &ldquo;{q.text}&rdquo;
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border-subtle">
        {card.keywords.map((k, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full bg-brand-50 text-[11px] text-brand-700"
          >
            #{k}
          </span>
        ))}
      </div>
    </article>
  );
}
