"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  findItemInBaseline,
  type BaselineReport,
  type BaselinePart,
  type BaselineQuestion,
  type BaselineInsight,
} from "@/lib/me/baseline-report";
import type {
  LongTermLayerCard,
  LongTermReport,
} from "@/lib/me/long-term-report";
import { SecondaryButton, PrimaryButton } from "@/components/PrimaryButton";
import {
  TodayAnswerCard,
  type AnswerCard,
} from "@/components/TodayAnswerCard";
import { useAnswerCards } from "@/lib/me/use-answer-cards";
import type { DayEntry, DayPair, Digest, DiaryEntry } from "./page";

/**
 * /me/report client — 3 tab 통합 보고서 (V4).
 *
 * V3 → V4 변경: 답변·셀프인터뷰·장기를 하나의 tabbed page로 합침. 기존
 * /me/report/full, /me/long-term, /me/reports는 redirect로 정리. 모바일에서
 * 메뉴 depth를 1단계로 감소.
 *
 * Tab 구조:
 *   - 답변(daily, default): 날짜 chip + 선택된 날 Q/A + digest. 기존 V3 그대로.
 *   - 셀프인터뷰(interview): baseline의 3 part를 인터뷰 순서대로
 *     (좋아하는 것 → 잘하는 것 → 가치 있는 것). Part는 sub-tab으로 swap.
 *   - 장기(long-term): 본인 누적 합성은 아직 비활성 — preview로 양식만 표시.
 *
 * URL: ?tab=interview|long-term 로 deep link. tab=daily는 query 생략.
 */

type TabKey = "daily" | "interview" | "long-term" | "diary";
const TAB_LABELS: Record<TabKey, string> = {
  daily: "매일",
  interview: "인터뷰",
  "long-term": "흐름",
  diary: "일기",
};
const TAB_ORDER: TabKey[] = ["daily", "interview", "long-term", "diary"];

/** 셀프인터뷰 tab의 part 표시 순서 — 실제 인터뷰 순서대로 */
const INTERVIEW_PART_ORDER = [
  "좋아하는 것",
  "잘하는 것",
  "가치 있는 것",
] as const;

function reorderParts(parts: BaselinePart[]): BaselinePart[] {
  const byTitle = new Map(parts.map((p) => [p.partTitle, p]));
  const ordered = INTERVIEW_PART_ORDER.map((t) => byTitle.get(t)).filter(
    (p): p is BaselinePart => p != null,
  );
  // 누락된 part 있으면 뒤에 붙이기 (방어적)
  const usedTitles = new Set(ordered.map((p) => p.partTitle));
  const extras = parts.filter((p) => !usedTitles.has(p.partTitle));
  return [...ordered, ...extras];
}

function isTabKey(v: string | null): v is TabKey {
  return v != null && (TAB_ORDER as string[]).includes(v);
}

export function MeReportClient({
  baseline,
  today,
  history,
  longTermPreview,
  diaryEntries,
}: {
  baseline: BaselineReport;
  today: DayEntry | null;
  history: DayEntry[];
  longTermPreview: LongTermReport;
  diaryEntries: DiaryEntry[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: TabKey = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "daily";
  const [tab, setTab] = useState<TabKey>(initialTab);

  // URL sync — replaceState만 (브라우저 history 안 쌓이게)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (tab === "daily") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const next =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", next);
  }, [tab]);

  // ConversationStage에서 답변 완료 후 ?fresh=1로 진입 시 한 번 server refresh.
  // qa_pair POST가 fire-and-forget이라 redirect 시점에 DB write가 약간 늦을
  // 수 있어 page server component가 빈 결과로 렌더되는 경우 대비. 답변 직후이므로
  // 답변 tab으로 강제 이동.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") !== "1") return;
    params.delete("fresh");
    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", newUrl);
    setTab("daily");
    const t = setTimeout(() => router.refresh(), 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <Hero baseline={baseline} onHome={() => router.push("/me")} />

        <TabBar tab={tab} onSelect={setTab} />

        <section className="flex-1 px-6 py-6 flex flex-col gap-6">
          {tab === "daily" ? (
            <DailyTab
              today={today}
              history={history}
              baseline={baseline}
              onStart={() => router.push("/me/conversation")}
            />
          ) : null}
          {tab === "interview" ? <InterviewTab baseline={baseline} /> : null}
          {tab === "long-term" ? (
            <LongTermTab report={longTermPreview} />
          ) : null}
          {tab === "diary" ? (
            <DiaryTab entries={diaryEntries} />
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

/* ─────────────── Hero ─────────────── */

function Hero({
  baseline,
  onHome,
}: {
  baseline: BaselineReport;
  onHome: () => void;
}) {
  return (
    <header className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] relative animate-fade-up">
      <button
        type="button"
        onClick={onHome}
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
        {baseline.userName}님의 보고서
      </p>
      <h1 className="text-2xl font-bold leading-snug">
        <span className="text-fg-dark-soft">내가 진정 하고 싶은 일은</span>
        <br />
        <span className="text-fg-dark">{baseline.headline}</span>
        <br />
        <span className="text-fg-dark-soft">이라고 합니다.</span>
      </h1>
    </header>
  );
}

/* ─────────────── Top tab bar ─────────────── */

function TabBar({
  tab,
  onSelect,
}: {
  tab: TabKey;
  onSelect: (next: TabKey) => void;
}) {
  return (
    <nav className="px-6 pt-6 -mb-2">
      <div
        role="tablist"
        className="grid grid-cols-4 gap-1 p-1 rounded-full bg-surface-card border border-border-subtle"
      >
        {TAB_ORDER.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(key)}
              className={
                active
                  ? "py-2 rounded-full bg-fg-light text-white text-xs font-semibold transition-colors"
                  : "py-2 rounded-full text-fg-light-soft text-xs font-medium hover:bg-brand-50 transition-colors"
              }
            >
              {TAB_LABELS[key]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ─────────────── Tab 1: 답변 (Daily) ─────────────── */

function DailyTab({
  today,
  history,
  baseline,
  onStart,
}: {
  today: DayEntry | null;
  history: DayEntry[];
  baseline: BaselineReport;
  onStart: () => void;
}) {
  const hasToday = today != null && today.pairs.length > 0;

  // 오늘 + 과거를 하나의 list로 (최신 순). chip strip rendering 기반.
  const allDays = useMemo<DayEntry[]>(
    () => (today ? [today, ...history] : history),
    [today, history],
  );
  const todayDateStr = today?.date ?? null;

  // 오늘 답변 있으면 default 선택, 없으면 빈 문자열 (chip 눌러야 펼쳐짐).
  // 과거 자동 select 제거 — Empty CTA 아래 옛 답변 자동 전개되는 게 부담스러움.
  const [selectedDate, setSelectedDate] = useState<string>(
    today?.date ?? "",
  );

  useEffect(() => {
    if (!selectedDate) return;
    if (allDays.some((d) => d.date === selectedDate)) return;
    setSelectedDate(today?.date ?? "");
  }, [allDays, selectedDate, today?.date]);

  const selectedDay = useMemo(
    () => allDays.find((d) => d.date === selectedDate) ?? null,
    [allDays, selectedDate],
  );
  const isSelectedToday =
    selectedDay != null && selectedDay.date === todayDateStr;

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

  const selectedDigest = isSelectedToday
    ? todayDigest
    : selectedDay?.digest ?? null;

  return (
    <>
      {!hasToday ? <EmptyTodayCta onStart={onStart} /> : null}

      {allDays.length >= 2 ? (
        <DateChipStrip
          days={allDays}
          todayDateStr={todayDateStr}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      ) : null}

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
    </>
  );
}

function EmptyTodayCta({ onStart }: { onStart: () => void }) {
  return (
    <article className="p-5 rounded-3xl bg-surface-card border border-border-subtle animate-fade-up-delay-1 text-center">
      <p className="text-base font-semibold text-fg-light leading-relaxed mb-2">
        잠깐 나에게 집중할 시간
      </p>
      <p className="text-sm text-fg-light-soft leading-relaxed">
        두 질문, 5분이면 충분해요.
      </p>
      <div className="mt-5">
        <PrimaryButton onClick={onStart}>오늘의 답변 시작하기</PrimaryButton>
      </div>
    </article>
  );
}

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
        {isToday ? "오늘 추가된 답변" : `${entry.label} 답변`} ·{" "}
        {entry.pairs.length}
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

/* ─────────────── Digest cards (DailyTab 안에서만 사용) ─────────────── */

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
        <p className="text-sm text-fg-light leading-relaxed">
          {digest.summary}
        </p>
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

/* ─────────────── Tab 2: 셀프인터뷰 (Interview) ─────────────── */

function InterviewTab({ baseline }: { baseline: BaselineReport }) {
  const ordered = useMemo(() => reorderParts(baseline.parts), [baseline.parts]);
  const [activePart, setActivePart] = useState(0);

  if (ordered.length === 0) {
    return (
      <article className="p-5 rounded-3xl bg-surface-card border border-border-subtle text-center">
        <p className="text-sm text-fg-light leading-relaxed">
          셀프인터뷰가 아직 정리되지 않았어요.
        </p>
      </article>
    );
  }

  const part = ordered[activePart];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Part sub-tab strip — 좋아함 → 잘함 → 가치 */}
      <div className="-mx-6 px-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {ordered.map((p, idx) => (
            <button
              key={p.partTitle}
              type="button"
              onClick={() => setActivePart(idx)}
              aria-pressed={activePart === idx}
              className={
                activePart === idx
                  ? "px-3.5 py-1.5 rounded-full bg-fg-light text-white text-xs font-semibold whitespace-nowrap transition-colors"
                  : "px-3.5 py-1.5 rounded-full bg-surface-card border border-border-subtle text-fg-light-soft text-xs font-medium whitespace-nowrap hover:bg-brand-50 hover:border-brand-200 transition-colors"
              }
            >
              {p.partTitle}
            </button>
          ))}
        </div>
      </div>

      <PartBody key={part.partTitle} part={part} />

      {baseline.closingNote ? (
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
          <p className="text-xs font-semibold text-fg-light-soft mb-2">
            코치인터뷰 소감
          </p>
          <p className="text-sm text-fg-light leading-relaxed">
            {baseline.closingNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PartBody({ part }: { part: BaselinePart }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-up-delay-1">
      <div
        className="p-5 rounded-3xl"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
        }}
      >
        <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-2">
          #셀프인터뷰
        </span>
        <h2 className="text-xl font-bold text-fg-light leading-snug">
          {part.partTitle}{" "}
          <span className="text-sm font-medium text-fg-light/70 ml-1">
            {part.partTitleEn}
          </span>
        </h2>
      </div>

      {part.questions.map((q, idx) => (
        <QuestionBlock key={idx} q={q} />
      ))}
    </div>
  );
}

function QuestionBlock({ q }: { q: BaselineQuestion }) {
  return (
    <article className="flex flex-col gap-4 pt-2 border-t border-border-subtle">
      <div>
        {q.meta ? (
          <p className="text-xs text-fg-light-soft mb-2">{q.meta}</p>
        ) : null}
        <h3 className="text-base font-semibold text-fg-light leading-snug">
          Q. {q.question}
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {q.items.map((item, idx) => (
          <div key={idx}>
            <h4 className="text-sm font-bold text-fg-light mb-2 pb-2 border-b border-border-subtle">
              {item.title}
            </h4>
            <ul className="space-y-2">
              {item.description.map((d, j) => (
                <li
                  key={j}
                  className="text-sm text-fg-light/90 leading-relaxed pl-3 relative"
                >
                  <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-fg-light-soft" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <InsightCard insight={q.insight} />
      {q.coachInterview.length > 0 ? (
        <CoachInterviewToggle items={q.coachInterview} />
      ) : null}
    </article>
  );
}

function InsightCard({ insight }: { insight: BaselineInsight }) {
  return (
    <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
      <p className="text-sm text-fg-light leading-relaxed">
        <span aria-hidden className="mr-1">
          💡
        </span>
        {insight.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-semibold text-brand-600 self-center mr-1">
          핵심 키워드
        </span>
        {insight.keywords.map((k, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full bg-white/70 text-[11px] text-fg-light"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoachInterviewToggle({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-fg-light-soft hover:text-fg-light transition-colors flex items-center gap-1"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        코치인터뷰 ({items.length})
      </button>
      {open ? (
        <div className="mt-2 pl-3 border-l-2 border-border-subtle flex flex-col gap-2">
          {items.map((line, idx) => (
            <p key={idx} className="text-xs text-fg-light-soft leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────── Tab 4: 일기 (Diary listing) ─────────────── */

function DiaryTab({ entries }: { entries: DiaryEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center text-center gap-4 px-2 py-12 animate-fade-up">
        <div className="text-4xl">📔</div>
        <h2 className="text-lg font-bold">아직 일기가 없어요</h2>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          오늘 한 일을 넣으면
          <br />이 자리에 첫 일기가 쌓여요.
        </p>
        <a
          href="/me/diary/new"
          className="mt-2 px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          오늘 일기 쓰기
        </a>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <p className="text-xs font-semibold text-brand-600 px-1">
        누적 일기 {entries.length}개 · 🔒 본인만 봅니다
      </p>
      {entries.map((entry, idx) => (
        <DiaryEntryCard key={entry.id} entry={entry} delayIdx={idx} />
      ))}
      <a
        href="/me/diary/new"
        className="mt-2 w-full py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold text-center transition-colors"
      >
        오늘 일기 쓰기
      </a>
    </div>
  );
}

function DiaryEntryCard({
  entry,
  delayIdx,
}: {
  entry: DiaryEntry;
  delayIdx: number;
}) {
  const delayClass =
    delayIdx === 0
      ? "animate-fade-up-delay-1"
      : delayIdx === 1
        ? "animate-fade-up-delay-2"
        : "animate-fade-up-delay-3";
  const relative = formatDiaryRelative(entry.entry_date);
  return (
    <article
      className={`p-4 rounded-[12px] border border-border-line bg-surface-paper ${delayClass}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-fg-light">
          {formatDiaryDate(entry.entry_date)}
        </p>
        <span className="text-[11px] text-fg-light-muted">{relative}</span>
      </div>

      {entry.ai_question ? (
        <div className="mb-3">
          {entry.ai_question_source ? (
            <p className="text-[10px] font-semibold text-purple-deep mb-1 tracking-wide">
              {entry.ai_question_source}
            </p>
          ) : null}
          <div
            className="text-xs text-fg-light-soft leading-relaxed line-clamp-3"
            dangerouslySetInnerHTML={{ __html: entry.ai_question }}
          />
        </div>
      ) : null}

      {entry.answer ? (
        <div className="mb-2 pl-3 border-l-2 border-brand-200">
          <p className="text-[10px] font-semibold text-brand-600 mb-1">답</p>
          <p className="text-sm text-fg-light leading-relaxed whitespace-pre-wrap">
            {entry.answer}
          </p>
        </div>
      ) : null}

      {entry.free_note ? (
        <div className="pl-3 border-l-2 border-border-line">
          <p className="text-[10px] font-semibold text-fg-light-muted mb-1">
            자유
          </p>
          <p className="text-sm text-fg-light-soft leading-relaxed whitespace-pre-wrap">
            {entry.free_note}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function formatDiaryDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")} (${weekday})`;
}

function formatDiaryRelative(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}달 전`;
}

/* ─────────────── Tab 3: 흐름 (Long-term, preview) ─────────────── */

function LongTermTab({ report }: { report: LongTermReport }) {
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="p-4 rounded-[12px] bg-selected-bg border border-brand-200">
        <p className="text-xs font-semibold text-purple-deep mb-1.5 tracking-wide">
          🔒 이후 공개 예정
        </p>
        <p className="text-sm text-fg-light leading-relaxed">
          지금은 양식 미리보기를 보여드려요. 답변이 충분히 쌓이면 본인의 4단계
          보고서로 채워질 거예요.
        </p>
      </div>

      {/* keyword chip */}
      {report.keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {report.keywords.map((k, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-fg-light"
            >
              #{k}
            </span>
          ))}
        </div>
      ) : null}

      <p className="text-[11px] text-fg-light-soft tracking-wide">
        {report.daySpan}일 누적 · 답변 {report.totalAnswers}개
      </p>

      {/* 4 layer card */}
      {report.layers.map((card, idx) => (
        <LayerCard key={card.layer} card={card} delayIdx={idx} />
      ))}
    </div>
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
