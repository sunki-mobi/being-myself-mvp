"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useConversation,
  type ConversationOptions,
} from "@/lib/conversation";
import type { BaselineReport } from "@/lib/me/baseline-report";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";
import { TodayAnswerCard } from "@/components/TodayAnswerCard";
import { useAnswerCards } from "@/lib/me/use-answer-cards";

/**
 * /demo/report — 박람회 게스트 보고서.
 *
 * /me/report와의 차이:
 *   - digest LLM 호출 없음 (페르소나 baseline이 [TODO]라 connections·tension은
 *     fabrication 위험 + 토큰 낭비)
 *   - hero echo-back headline 의존 제거 — baseline.headline이 [TODO]면 어색
 *   - "장기 누적 미리보기" 카드로 풀 baseline 보고서 진입 유도 (페르소나별
 *     [TODO] 슬롯이 채워지면 그게 6개월 후 모습)
 *
 * 게스트당 LLM 호출 = answer-card ×2 (digest 1회 절감).
 */
export function DemoReportStage({
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
  fullReportPath: string;
  newSessionPath: string;
  homePath: string;
}) {
  const router = useRouter();
  const { state, hydrated, reset } = useConversation(conversationOptions);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.userName) {
      router.replace(homePath);
    }
  }, [hydrated, state.userName, router, homePath]);

  // 오늘 추가된 Q/A 페어
  // /demo는 anonymous라 qaPairId 없음 — useAnswerCards가 캐시 우회
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

  const { cards: answerCards, loading: answerCardsLoading } = useAnswerCards(
    todayPairs,
    hydrated,
  );

  if (!hydrated) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const hasToday = todayPairs.length > 0;

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Hero — 게스트는 누적이 없으니 echo-back headline 대신 간결한 환영 톤 */}
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
            {baseline.userName}님 · 오늘의 두 답변
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-fg-dark">짧은 두 호흡이</span>
            <br />
            <span className="text-fg-dark-soft">어디로 이어질까요?</span>
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-6">
          {hasToday ? (
            <div className="flex flex-col gap-4 animate-fade-up-delay-1">
              <p className="text-xs font-semibold text-brand-600 px-1">
                오늘 답변 · {todayPairs.length}개
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
            <article className="p-5 rounded-[12px] bg-surface-paper border border-border-line shadow-card animate-fade-up-delay-1 text-center">
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

          {/* 장기 누적 미리보기 — 페르소나별 풀 baseline 보고서로 진입 */}
          {hasToday ? (
            <article
              className="mt-2 p-5 rounded-[12px] bg-surface-dark text-fg-dark shadow-button cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all animate-fade-up-delay-2"
              onClick={() => router.push(fullReportPath)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(fullReportPath);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-brand-100 mb-1 tracking-wide">
                    6개월 뒤 모습
                  </p>
                  <p className="text-base font-bold leading-snug mb-2">
                    오늘 두 호흡이 쌓이면
                    <br />
                    이런 보고서가 됩니다
                  </p>
                  <p className="text-xs text-fg-dark-soft leading-relaxed">
                    현상 · 본질 · 가치 · 존재 · 4단계 누적 보고서
                  </p>
                </div>
                <span aria-hidden className="text-2xl text-fg-dark-soft mt-1">
                  →
                </span>
              </div>
            </article>
          ) : null}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          {hasToday ? (
            <PrimaryButton
              onClick={() => {
                reset();
                router.push(newSessionPath);
              }}
            >
              새로운 두 질문 시작하기
            </PrimaryButton>
          ) : null}
          <SecondaryButton onClick={() => router.push(homePath)}>
            홈으로
          </SecondaryButton>
        </section>
      </div>
    </main>
  );
}
