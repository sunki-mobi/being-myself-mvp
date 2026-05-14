"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useConversation,
  type ConversationOptions,
} from "@/lib/conversation";
import {
  findItemInBaseline,
  type BaselineReport,
} from "@/lib/me/baseline-report";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";
import { TodayAnswerCard } from "@/components/TodayAnswerCard";
import { useAnswerCards } from "@/lib/me/use-answer-cards";

type Connection = {
  partTitle: string;
  itemTitle: string;
  note: string;
};

type Digest = {
  summary: string;
  connections: Connection[];
  tension: string;
  nextThread: string;
};

/**
 * 오늘 중심 보고서 stage — /me/report 전용.
 *
 * 흐름:
 *   1. echo-back 헤드라인 (baseline.headline)
 *   2. 오늘 답변 → answer-card LLM 정리
 *   3. 4단 digest (정리 / 연결 / 대비 / 내일의 씨앗)
 *   4. 전체 보고서 CTA (옵션 — fullReportPath가 있을 때만)
 *
 * /demo/report는 baseline이 [TODO]라 connections가 fabrication 위험. 별도
 * `DemoReportStage`로 digest 호출 없이 answer-card + 풀 baseline preview 진입만.
 */
export function ReportStage({
  baseline,
  conversationOptions,
  onBack,
  fullReportPath,
  newSessionPath,
  homePath,
}: {
  baseline: BaselineReport;
  conversationOptions: ConversationOptions;
  onBack: () => void;
  fullReportPath?: string;
  newSessionPath: string;
  homePath: string;
}) {
  const router = useRouter();
  const { state, hydrated } = useConversation(conversationOptions);

  const [digest, setDigest] = useState<Digest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [digestRetry, setDigestRetry] = useState(0);
  const digestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.userName) {
      router.replace(homePath);
    }
  }, [hydrated, state.userName, router, homePath]);

  // 오늘 추가된 Q/A 페어
  const todayPairs: {
    question: string;
    answer: string;
    key: string;
    qaPairId?: string;
  }[] = [];
  let lastQ = "";
  for (const m of state.messages) {
    if (m.role === "ai-question") {
      lastQ = m.text;
    } else if (m.role === "user-answer") {
      todayPairs.push({
        question: lastQ,
        answer: m.text,
        qaPairId: m.qaPairId,
        key: `${lastQ}::${m.text}`,
      });
    }
  }

  // 답변별 잡지 톤 정리 카드 백그라운드 fetch
  const { cards: answerCards, loading: answerCardsLoading } = useAnswerCards(
    todayPairs,
    hydrated,
  );

  // 4단 digest — 답변 본문 join + baselineId 변경 시 한 번만
  useEffect(() => {
    if (!hydrated || !state.userName) return;

    const pairs: { question: string; answer: string }[] = [];
    let q = "";
    for (const m of state.messages) {
      if (m.role === "ai-question") q = m.text;
      else if (m.role === "user-answer")
        pairs.push({ question: q, answer: m.text });
    }
    if (pairs.length === 0) return;

    const key = `${conversationOptions.baselineId ?? "default"}::${pairs.map((p) => p.answer).join("\n")}`;
    if (digestKeyRef.current === key) return;
    digestKeyRef.current = key;

    setDigestLoading(true);
    setDigestError(null);
    fetch("/api/me/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: state.userName,
        todayAnswers: pairs,
        ...(conversationOptions.baselineId
          ? { baselineId: conversationOptions.baselineId }
          : {}),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.error ?? `요청 실패 (${res.status})`);
        }
        return res.json();
      })
      .then((data: Digest) => setDigest(data))
      .catch((err) => {
        setDigestError(
          err instanceof Error ? err.message : "정리를 만들지 못했어요.",
        );
      })
      .finally(() => setDigestLoading(false));
  }, [
    hydrated,
    state.userName,
    state.messages,
    conversationOptions.baselineId,
    digestRetry,
  ]);

  if (!hydrated) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const hasToday = todayPairs.length > 0;

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Hero — echo-back headline */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] relative animate-fade-up">
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로"
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
            {baseline.userName}님 · 오늘의 보고서
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
          {hasToday ? (
            <div className="flex flex-col gap-4 animate-fade-up-delay-1">
              <p className="text-xs font-semibold text-brand-600 px-1">
                오늘 추가된 답변 · {todayPairs.length}
              </p>
              {todayPairs.map((pair, idx) => (
                <TodayAnswerCard
                  key={pair.key}
                  index={idx + 1}
                  pair={pair}
                  card={answerCards[pair.key]}
                  loading={Boolean(answerCardsLoading[pair.key])}
                />
              ))}
            </div>
          ) : (
            <article className="p-5 rounded-3xl bg-surface-card border border-border-subtle animate-fade-up-delay-1 text-center">
              <p className="text-base font-semibold text-fg-light leading-relaxed mb-2">
                오늘 두 호흡으로 시작해볼까요?
              </p>
              <p className="text-sm text-fg-light-soft leading-relaxed">
                두 번의 질문, 5분이면 충분해요.
              </p>
              <div className="mt-5">
                <PrimaryButton onClick={() => router.push(newSessionPath)}>
                  오늘의 두 질문 시작하기
                </PrimaryButton>
              </div>
            </article>
          )}

          {hasToday && digestLoading ? <DigestSkeleton /> : null}

          {hasToday && digestError ? (
            <article className="p-5 rounded-3xl bg-brand-50 border border-brand-100">
              <p className="text-xs font-semibold text-brand-600 mb-1">
                정리가 잠시 멈췄어요
              </p>
              <p className="text-sm text-fg-light leading-relaxed mb-3">
                {digestError}
              </p>
              <button
                type="button"
                onClick={() => {
                  // digestKeyRef 리셋 + retry counter ↑ → useEffect 재실행
                  digestKeyRef.current = null;
                  setDigestError(null);
                  setDigestRetry((c) => c + 1);
                }}
                className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                다시 정리해보기 →
              </button>
            </article>
          ) : null}

          {hasToday && digest ? (
            <DigestCards digest={digest} baseline={baseline} />
          ) : null}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <SecondaryButton onClick={() => router.push(homePath)}>
            홈으로
          </SecondaryButton>
        </section>
      </div>
    </main>
  );
}

/* ──────────────────── Digest cards ──────────────────── */

function DigestSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-surface-card border border-border-subtle animate-fade-up-delay-2">
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

function DigestCards({
  digest,
  baseline,
}: {
  digest: Digest;
  baseline: BaselineReport;
}) {
  const hasTension = digest.tension && digest.tension.trim().length > 0;
  return (
    <div className="flex flex-col gap-5 animate-fade-up-delay-2">
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
  connection: Connection;
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
          “{item.description[0]}”
        </p>
      ) : null}
      <p className="text-sm text-fg-light leading-relaxed pt-2 border-t border-border-subtle">
        {connection.note}
      </p>
    </article>
  );
}
