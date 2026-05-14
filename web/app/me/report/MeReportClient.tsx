"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  findItemInBaseline,
  type BaselineReport,
} from "@/lib/me/baseline-report";
import { SecondaryButton, PrimaryButton } from "@/components/PrimaryButton";
import {
  TodayAnswerCard,
  type AnswerCard,
} from "@/components/TodayAnswerCard";
import { useAnswerCards } from "@/lib/me/use-answer-cards";
import type { DayEntry, DayPair, Digest } from "./page";

/**
 * /me/report client — 오늘의 답변 + 이전 답변 더보기.
 *
 * Server에서 baseline + qa_pair + digest 캐시 그룹화 후 전달.
 *  - today != null: 오늘 Q/A list + digest (캐시 hit이면 즉시, miss이면 client
 *    에서 /api/me/digest fetch → daily_digest 캐시에 저장)
 *  - today == null: "오늘의 답변 시작하기" CTA + history 자동 펼침
 *  - history: 날짜별 collapsible (날짜 클릭 → 그날 Q/A + digest 펼침)
 */
export function MeReportClient({
  baseline,
  today,
  history,
}: {
  baseline: BaselineReport;
  today: DayEntry | null;
  history: DayEntry[];
}) {
  const router = useRouter();
  const hasToday = today != null && today.pairs.length > 0;

  // 오늘 답변 중 answer_card 캐시 miss된 pair → client에서 fetch + DB 저장.
  // 다음 진입 시 server-side 조회에서 캐시 hit.
  const todayPairsForCards = useMemo(
    () =>
      (today?.pairs ?? [])
        .filter((p) => !p.answerCard)
        .map((p) => ({
          question: p.question,
          answer: p.answer,
          key: p.qaPairId,
          qaPairId: p.qaPairId,
        })),
    [today],
  );
  const { cards: clientCards, loading: cardLoading } = useAnswerCards(
    todayPairsForCards,
    true,
  );

  function resolveCard(pair: DayPair): AnswerCard | undefined {
    return pair.answerCard ?? clientCards[pair.qaPairId];
  }

  // 오늘 digest 캐시 hit이면 그대로, miss이면 client에서 fetch
  const [todayDigest, setTodayDigest] = useState<Digest | null>(
    today?.digest ?? null,
  );
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToday || !today || today.digest) return;
    setDigestLoading(true);
    setDigestError(null);
    fetch("/api/me/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: baseline.userName,
        todayAnswers: today.pairs.map((p) => ({
          question: p.question,
          answer: p.answer,
        })),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.error ?? `요청 실패 (${res.status})`);
        }
        return res.json();
      })
      .then((data: Digest) => setTodayDigest(data))
      .catch((err) =>
        setDigestError(
          err instanceof Error ? err.message : "정리를 만들지 못했어요.",
        ),
      )
      .finally(() => setDigestLoading(false));
  }, [hasToday, today, baseline.userName]);

  // 이전 답변 — 오늘 답변 안 했으면 자동 펼침, 답변 했으면 접힘 (사용자가 토글)
  const [historyExpanded, setHistoryExpanded] = useState(!hasToday);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  function toggleDay(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Hero — echo-back headline */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] relative animate-fade-up">
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
            {baseline.userName}님 · 오늘의 답변
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-fg-dark-soft">내가 진정 하고 싶은 일은</span>
            <br />
            <span className="text-fg-dark">{baseline.headline}</span>
            <br />
            <span className="text-fg-dark-soft">이라고 합니다.</span>
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-6">
          {hasToday && today ? (
            <TodayBlock
              entry={today}
              digest={todayDigest}
              digestLoading={digestLoading}
              digestError={digestError}
              baseline={baseline}
              resolveCard={resolveCard}
              cardLoading={cardLoading}
            />
          ) : (
            <EmptyTodayCta onStart={() => router.push("/me/conversation")} />
          )}

          {/* 이전 답변 더보기 */}
          {history.length > 0 ? (
            <div className="flex flex-col gap-3 animate-fade-up-delay-2">
              <button
                type="button"
                onClick={() => setHistoryExpanded((v) => !v)}
                className="flex items-center justify-between px-2 py-1 text-left"
              >
                <p className="text-xs font-semibold text-fg-light-soft">
                  이전 답변 {history.length}일
                </p>
                <span
                  aria-hidden
                  className="text-sm text-fg-light-soft transition-transform"
                  style={{
                    transform: historyExpanded
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                >
                  ▸
                </span>
              </button>

              {historyExpanded ? (
                <div className="flex flex-col gap-2">
                  {history.map((entry) => (
                    <HistoryDayRow
                      key={entry.date}
                      entry={entry}
                      expanded={expandedDays.has(entry.date)}
                      onToggle={() => toggleDay(entry.date)}
                      baseline={baseline}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <SecondaryButton onClick={() => router.push("/me")}>
            홈으로
          </SecondaryButton>
        </section>
      </div>
    </main>
  );
}

/* ─────────────── Empty (오늘 답변 없을 때) ─────────────── */

function EmptyTodayCta({ onStart }: { onStart: () => void }) {
  return (
    <article className="p-5 rounded-3xl bg-surface-card border border-border-subtle animate-fade-up-delay-1 text-center">
      <p className="text-base font-semibold text-fg-light leading-relaxed mb-2">
        오늘 두 호흡으로 시작해볼까요?
      </p>
      <p className="text-sm text-fg-light-soft leading-relaxed">
        두 번의 질문, 5분이면 충분해요.
      </p>
      <div className="mt-5">
        <PrimaryButton onClick={onStart}>오늘의 답변 시작하기</PrimaryButton>
      </div>
    </article>
  );
}

/* ─────────────── 오늘 블록 ─────────────── */

function TodayBlock({
  entry,
  digest,
  digestLoading,
  digestError,
  baseline,
  resolveCard,
  cardLoading,
}: {
  entry: DayEntry;
  digest: Digest | null;
  digestLoading: boolean;
  digestError: string | null;
  baseline: BaselineReport;
  resolveCard: (pair: DayPair) => AnswerCard | undefined;
  cardLoading: Record<string, boolean>;
}) {
  return (
    <div className="flex flex-col gap-4 animate-fade-up-delay-1">
      <p className="text-xs font-semibold text-brand-600 px-1">
        오늘 추가된 답변 · {entry.pairs.length}
      </p>
      {entry.pairs.map((pair, idx) => (
        <TodayAnswerCard
          key={pair.qaPairId}
          index={idx + 1}
          pair={{ question: pair.question, answer: pair.answer }}
          card={resolveCard(pair)}
          loading={Boolean(cardLoading[pair.qaPairId])}
        />
      ))}

      {digestLoading ? <DigestSkeleton /> : null}
      {digestError ? <DigestError error={digestError} /> : null}
      {digest ? <DigestCards digest={digest} baseline={baseline} /> : null}
    </div>
  );
}

/* ─────────────── 이전 날짜 row ─────────────── */

function HistoryDayRow({
  entry,
  expanded,
  onToggle,
  baseline,
}: {
  entry: DayEntry;
  expanded: boolean;
  onToggle: () => void;
  baseline: BaselineReport;
}) {
  return (
    <article className="rounded-[12px] border border-border-line bg-surface-paper overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-50/40 transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-bold text-fg-light">{entry.label}</p>
          <p className="text-[11px] text-fg-light-muted">
            답변 {entry.pairs.length}개
            {entry.digest ? " · 정리 있음" : ""}
          </p>
        </div>
        <span
          aria-hidden
          className="text-sm text-fg-light-soft transition-transform"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▸
        </span>
      </button>

      {expanded ? (
        <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-border-line">
          {entry.pairs.map((pair, idx) => (
            <TodayAnswerCard
              key={pair.qaPairId}
              index={idx + 1}
              pair={{ question: pair.question, answer: pair.answer }}
              card={pair.answerCard ?? undefined}
              loading={false}
            />
          ))}
          {entry.digest ? (
            <DigestCards digest={entry.digest} baseline={baseline} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/* ─────────────── Digest cards (ReportStage에서 이식) ─────────────── */

function DigestSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.3s]" />
        </span>
        <p className="text-xs text-fg-light-soft">
          오늘 답변을 baseline과 잇고 있어요
        </p>
      </div>
    </div>
  );
}

function DigestError({ error }: { error: string }) {
  return (
    <article className="p-4 rounded-3xl bg-brand-50 border border-brand-100">
      <p className="text-xs font-semibold text-brand-600 mb-1">
        정리가 잠시 멈췄어요
      </p>
      <p className="text-sm text-fg-light leading-relaxed">{error}</p>
    </article>
  );
}

function DigestCards({
  digest,
  baseline,
}: {
  digest: Digest;
  baseline: BaselineReport;
}) {
  const hasTension = digest.tension && digest.tension.trim().length > 0;
  return (
    <div className="flex flex-col gap-5">
      <article className="p-5 rounded-3xl bg-brand-50 border border-brand-100">
        <p className="text-xs font-semibold text-brand-600 mb-2">오늘의 정리</p>
        <p className="text-sm text-fg-light leading-relaxed">{digest.summary}</p>
      </article>

      {digest.connections.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-fg-light-soft px-1">
            기존 보고서와 닿는 부분
          </p>
          {digest.connections.slice(0, 2).map((c, idx) => (
            <ConnectionCard key={idx} connection={c} baseline={baseline} />
          ))}
        </div>
      ) : null}

      {hasTension ? (
        <article className="p-5 rounded-3xl bg-surface-dark text-fg-dark">
          <p className="text-xs font-semibold text-brand-200 mb-2">
            흥미로운 대비
          </p>
          <p className="text-sm leading-relaxed">{digest.tension}</p>
        </article>
      ) : null}

      {digest.nextThread ? (
        <article className="p-4 rounded-2xl border-2 border-dashed border-brand-200">
          <p className="text-[10px] font-semibold text-brand-600 mb-1.5 tracking-wide">
            내일의 씨앗
          </p>
          <p className="text-sm text-fg-light leading-relaxed italic">
            {digest.nextThread}
          </p>
        </article>
      ) : null}
    </div>
  );
}

function ConnectionCard({
  connection,
  baseline,
}: {
  connection: { partTitle: string; itemTitle: string; note: string };
  baseline: BaselineReport;
}) {
  const item = findItemInBaseline(
    baseline,
    connection.partTitle,
    connection.itemTitle,
  );
  return (
    <article className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
      <div className="flex items-start gap-2 mb-2">
        <span className="inline-block px-2 py-0.5 rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700 tracking-wide">
          {connection.partTitle}
        </span>
      </div>
      <h4 className="text-sm font-bold text-fg-light mb-2">
        {connection.itemTitle}
      </h4>
      {item ? (
        <p className="text-xs text-fg-light-soft leading-relaxed mb-3 italic">
          &ldquo;{item.description[0]}&rdquo;
        </p>
      ) : null}
      <p className="text-sm text-fg-light leading-relaxed pt-2 border-t border-border-subtle">
        {connection.note}
      </p>
    </article>
  );
}
