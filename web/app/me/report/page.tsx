"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConversation, QUESTION_POOL } from "@/lib/conversation";
import { SecondaryButton } from "@/components/PrimaryButton";

/**
 * /me/report — 누적 답변 기반 간단 보고서
 *
 * 박람회 데모와 다르게:
 *   - 사용자가 직접 쓴 텍스트 답변이 핵심
 *   - 답변을 그대로 인용하면서 "내가 한 말"이 보고서가 되는 경험
 *
 * Phase B에서는:
 *   - 누적된 모든 대화를 컨텍스트로 Claude API가 헤드라인·인사이트 생성
 *   - 자기 셀프인터뷰 데이터와 비교/연결되는 패턴 표시
 */
export default function MeReportPage() {
  const router = useRouter();
  const { state, hydrated, reset, isComplete } = useConversation();

  // 답변 하나도 없으면 conversation으로 보냄
  useEffect(() => {
    if (!hydrated) return;
    if (!state.userName) {
      router.replace("/me");
      return;
    }
    const answers = state.messages.filter((m) => m.role === "user-answer");
    if (answers.length === 0) {
      router.replace("/me/conversation");
    }
  }, [hydrated, state, router]);

  if (!hydrated || !state.userName) {
    return <div className="min-h-screen bg-surface-light" />;
  }

  const answers = state.messages.filter((m) => m.role === "user-answer");

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:overflow-hidden lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Dark hero */}
        <section className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] animate-fade-up">
          <p className="text-xs font-medium text-fg-dark-soft mb-3">
            {state.userName}님과 나눈 이야기
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            오늘 {answers.length}개의 답변이 모였어요.
          </h1>
          <p className="mt-4 text-sm text-fg-dark-soft leading-relaxed">
            {isComplete
              ? "이 답변들이 당신의 소명 지도를 조금 더 선명하게 만들어가고 있어요."
              : "대화는 매일 이어집니다. 누적될수록 내가 더 선명해져요."}
          </p>
        </section>

        {/* Body — Q&A pairs */}
        <section className="flex-1 px-6 py-10 flex flex-col gap-8">
          {answers.map((answer, idx) => {
            const qIdx = answer.questionIndex ?? idx;
            const question = QUESTION_POOL[qIdx] ?? "";
            const delayClass =
              idx === 0
                ? "animate-fade-up-delay-1"
                : idx === 1
                  ? "animate-fade-up-delay-2"
                  : "animate-fade-up-delay-3";
            return (
              <article key={idx} className={delayClass}>
                <p className="text-xs font-medium text-brand-500 mb-2">
                  Q{idx + 1}
                </p>
                <h3 className="text-base font-semibold text-fg-light mb-3 leading-snug">
                  {question}
                </h3>
                <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
                  <p className="text-base leading-relaxed text-fg-light/90 whitespace-pre-wrap">
                    {answer.text}
                  </p>
                </div>
              </article>
            );
          })}

          {/* Phase B 예고 */}
          <article
            className="p-5 rounded-3xl animate-fade-up-delay-3"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
            }}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden className="text-xl leading-none">
                💡
              </span>
              <div className="flex-1">
                <p className="text-sm text-fg-light leading-relaxed">
                  <span className="font-semibold">Phase B</span>에서는 이
                  답변들이 누적되면서, 당신의 셀프인터뷰 데이터와 연결된
                  인사이트가 자동으로 생성됩니다. 매일의 짧은 대화가 모여
                  소명의 한 줄로 정리되는 경험을 곧 만나보실 수 있어요.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <SecondaryButton
            onClick={() => {
              reset();
              router.push("/me");
            }}
          >
            새로 시작하기
          </SecondaryButton>
          <SecondaryButton onClick={() => router.push("/")}>
            트랙 선택으로
          </SecondaryButton>
          <p className="text-center text-xs text-fg-light-soft mt-2">
            Being Myself · Phase B preview
          </p>
        </section>
      </div>
    </main>
  );
}
