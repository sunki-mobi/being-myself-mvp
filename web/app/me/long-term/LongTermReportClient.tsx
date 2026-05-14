"use client";

import { useState } from "react";
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
 *
 * Phase 4b — staleness 표시 + 수동 재합성:
 *  - `pendingAnswers`: 마지막 합성 이후 추가된 qa_pair 수
 *  - `isStale`: pendingAnswers가 임계점(3) 이상이면 true → "반영하기" 배너 강조
 *  - "보고서 새로 만들기" 버튼 → POST /api/me/long-term-report/refresh →
 *    router.refresh()로 서버 컴포넌트 재실행 → 새 캐시로 다시 렌더
 */
export function LongTermReportClient({
  report,
  pendingAnswers,
  isStale,
  isPreview = false,
}: {
  report: LongTermReport;
  pendingAnswers: number;
  isStale: boolean;
  /**
   * true면 hero 아래 "이후 공개 예정" 안내 + 하단 재합성/stale 배너 숨김.
   * 11명 오픈 직전 단계 — 본인 누적 합성 활성화 전 양식 미리보기.
   */
  isPreview?: boolean;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setError(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/me/long-term-report/refresh", {
        method: "POST",
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `재합성 실패 (${res.status})`);
        setRefreshing(false);
        return;
      }
      router.refresh();
      // refresh() 완료 후 server component가 새 row로 다시 렌더 → 이 컴포넌트
      // 새 props로 마운트되므로 별도 setRefreshing(false) 불필요. 다만 보호용:
      setTimeout(() => setRefreshing(false), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setRefreshing(false);
    }
  }

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

        {/* Preview 안내 — 본인 누적 합성 활성화 전 양식 미리보기 */}
        {isPreview ? (
          <section className="px-6 pt-5 -mb-3">
            <div className="p-4 rounded-[12px] bg-selected-bg border border-brand-200 animate-fade-up">
              <p className="text-xs font-semibold text-purple-deep mb-1.5 tracking-wide">
                🔒 이후 공개 예정
              </p>
              <p className="text-sm text-fg-light leading-relaxed">
                지금은 양식 미리보기를 보여드려요. 답변이 충분히 쌓이면 본인의
                4단계 보고서로 채워질 거예요.
              </p>
            </div>
          </section>
        ) : null}

        {/* 4 layer */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-5">
          {report.layers.map((card, idx) => (
            <LayerCard key={card.layer} card={card} delayIdx={idx} />
          ))}
        </section>

        {/* Stale 배너 — preview 모드일 땐 숨김 */}
        {!isPreview && isStale && !refreshing ? (
          <section className="px-6 pb-2">
            <div className="p-4 rounded-[12px] bg-selected-bg border border-brand-200">
              <p className="text-sm text-fg-light leading-relaxed">
                ✨ 마지막 합성 이후 답변 <b>{pendingAnswers}개</b>가 더 쌓였어요.
                <br />
                새로 만들면 더 또렷한 그림이 나올 수 있어요.
              </p>
            </div>
          </section>
        ) : null}

        {!isPreview && error ? (
          <section className="px-6 pb-2">
            <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
              {error}
            </p>
          </section>
        ) : null}

        <section className="px-6 pb-10 flex flex-col gap-3">
          {!isPreview ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className={`w-full px-6 py-3 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isStale
                  ? "bg-brand-500 hover:bg-brand-600 text-white"
                  : "bg-surface-card text-fg-light hover:bg-brand-50"
              }`}
            >
              {refreshing
                ? "다시 만들고 있어요…"
                : isStale
                  ? `새 답변 ${pendingAnswers}개 반영해서 새로 만들기`
                  : "보고서 새로 만들기"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/me")}
            disabled={refreshing}
            className="w-full px-6 py-3 rounded-full bg-transparent text-fg-light-soft text-sm font-medium hover:text-fg-light transition-colors disabled:opacity-50"
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
