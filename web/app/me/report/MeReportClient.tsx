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
 * /me/report client — 날짜 chip + 선택된 하루 답변.
 *
 * V2 UX (피드백 반영): 이전 답변 stacked accordion → 가로 스크롤 날짜 chip strip.
 * 사용자가 chip 하나를 누르면 그 날의 답변 카드 + digest로 swap.
 *
 * - today != null이면 default 선택, 없으면 가장 최근 history 날
 * - digest: today 선택 + 캐시 miss이면 /api/me/digest fetch (기존 로직 유지).
 *   과거 날짜는 daily_digest 캐시만 사용 — 미스인 경우 정리 카드는 숨김
 *   (LLM 재호출 X, 비용·UI 단순성 우선).
 * - answer_card: 선택된 날의 cache miss pair만 client fetch
 *
 * 누적 100일+이면 가로 스크롤이 길어지는 한계 있음 — 추후 디자인 재구상 시점에
 * 다시 고민.
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

  // 오늘 + 과거를 하나의 list로 (최신 순). chip strip rendering 기반.
  const allDays = useMemo<DayEntry[]>(
    () => (today ? [today, ...history] : history),
    [today, history],
  );
  const todayDateStr = today?.date ?? null;

  const [selectedDate, setSelectedDate] = useState<string>(
    today?.date ?? history[0]?.date ?? "",
  );

  // 서버 데이터 갱신(?fresh=1 refresh 후)에 따라 default 재조정
  useEffect(() => {
    if (selectedDate && allDays.some((d) => d.date === selectedDate)) return;
    setSelectedDate(today?.date ?? history[0]?.date ?? "");
  }, [allDays, selectedDate, today?.date, history]);

  const selectedDay = useMemo(
    () => allDays.find((d) => d.date === selectedDate) ?? null,
    [allDays, selectedDate],
  );
  const isSelectedToday =
    selectedDay != null && selectedDay.date === todayDateStr;

  // ConversationStage에서 답변 완료 후 ?fresh=1로 진입 시 한 번 server refresh.
  // qa_pair POST가 fire-and-forget이라 redirect 시점에 DB write가 약간 늦을
  // 수 있어 page server component가 빈 결과로 렌더되는 경우 대비.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") !== "1") return;
    params.delete("fresh");
    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
    const t = setTimeout(() => router.refresh(), 1200);
    return () => clearTimeout(t);
  }, [router]);

  // answer_card 캐시 miss된 pair → client에서 fetch + DB 저장.
  // 선택된 날 한 개만 처리 — chip 갈아탈 때마다 새로 fetch (LLM 비용 절약).
  const pairsForCards = useMemo(() => {
    if (!selectedDay) return [];
    return selectedDay.pairs
      .filter((p) => !p.answerCard)
      .map((p) => ({
        question: p.question,
        answer: p.answer,
        key: p.qaPairId,
        qaPairId: p.qaPairId,
      }));
  }, [selectedDay]);

  const { cards: clientCards, loading: cardLoading } = useAnswerCards(
    pairsForCards,
    true,
  );

  function resolveCard(pair: DayPair): AnswerCard | undefined {
    return pair.answerCard ?? clientCards[pair.qaPairId];
  }
  function resolveLoading(pair: DayPair): boolean {
    return !pair.answerCard && Boolean(cardLoading[pair.qaPairId]);
  }

  // 오늘 digest 캐시 hit이면 그대로, miss이면 client에서 fetch.
  // 과거 날짜는 daily_digest 캐시만 — 미스이면 정리 카드 그냥 숨김.
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

  // 선택된 날의 digest. 오늘이면 client fetch 결과까지 반영, 과거면 서버 캐시 그대로.
  const selectedDigest = isSelectedToday
    ? todayDigest
    : selectedDay?.digest ?? null;

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
          {/* 오늘 답변이 없으면 CTA가 가장 먼저 보여야 함 */}
          {!hasToday ? (
            <EmptyTodayCta onStart={() => router.push("/me/conversation")} />
          ) : null}

          {/* 날짜 chip strip — 2일 이상 누적됐을 때만 표시 */}
          {allDays.length >= 2 ? (
            <DateChipStrip
              days={allDays}
              todayDateStr={todayDateStr}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          ) : null}

          {/* 선택된 날의 답변 + digest */}
          {selectedDay ? (
            <SelectedDayBlock
              entry={selectedDay}
              isToday={isSelectedToday}
              digest={selectedDigest}
              digestLoading={isSelectedToday ? digestLoading : false}
              digestError={isSelectedToday ? digestError : null}
              baseline={baseline}
              resolveCard={resolveCard}
              resolveLoading={resolveLoading}
            />
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

/* ─────────────── 날짜 chip strip ─────────────── */

function DateChipStrip({
  days,
  todayDateStr,
  selectedDate,
  onSelect,
}: {
  days: DayEntry[];
  todayDateStr: string | null;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="-mx-6 px-6 overflow-x-auto animate-fade-up-delay-1">
      <div className="flex gap-2 min-w-max pb-1">
        {days.map((d) => {
          const isToday = d.date === todayDateStr;
          const isSelected = d.date === selectedDate;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelect(d.date)}
              aria-pressed={isSelected}
              className={
                isSelected
                  ? "px-3.5 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                  : "px-3.5 py-1.5 rounded-full bg-surface-card border border-border-subtle text-fg-light-soft text-xs font-medium whitespace-nowrap hover:bg-brand-50 hover:border-brand-200 transition-colors"
              }
            >
              {isToday ? "오늘" : d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── 선택된 하루 블록 ─────────────── */

function SelectedDayBlock({
  entry,
  isToday,
  digest,
  digestLoading,
  digestError,
  baseline,
  resolveCard,
  resolveLoading,
}: {
  entry: DayEntry;
  isToday: boolean;
  digest: Digest | null;
  digestLoading: boolean;
  digestError: string | null;
  baseline: BaselineReport;
  resolveCard: (pair: DayPair) => AnswerCard | undefined;
  resolveLoading: (pair: DayPair) => boolean;
}) {
  return (
    <div className="flex flex-col gap-4 animate-fade-up-delay-2">
      <p className="text-xs font-semibold text-brand-600 px-1">
        {isToday ? "오늘 추가된 답변" : `${entry.label} 답변`} · {entry.pairs.length}
      </p>
      {entry.pairs.map((pair, idx) => (
        <TodayAnswerCard
          key={pair.qaPairId}
          index={idx + 1}
          pair={{ question: pair.question, answer: pair.answer }}
          card={resolveCard(pair)}
          loading={resolveLoading(pair)}
        />
      ))}

      {digestLoading ? <DigestSkeleton /> : null}
      {digestError ? <DigestError error={digestError} /> : null}
      {digest ? <DigestCards digest={digest} baseline={baseline} /> : null}
    </div>
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
