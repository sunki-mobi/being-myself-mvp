"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { getPersona } from "@/lib/personas";
import type { ChoiceKey, StepIndex } from "@/lib/types";
import { StageContainer } from "@/components/StageContainer";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";

/**
 * S-06 질문 화면 (q/1, q/2)
 *
 * 동적 segment [step]:
 *   - "1" → 첫 번째 질문
 *   - "2" → 두 번째 질문
 *   - 그 외 → /로 redirect
 *
 * 흐름:
 *   1. 진입 → 질문 + 선택지 3개 + 비활성 "다음" 버튼
 *   2. 선택지 탭 → 카드 하이라이트 + 짧은 딜레이 후 AI 리액션 버블 fade-in
 *   3. "다음" 활성화 → 답변 저장 → /q/2 또는 /report
 *   4. 선택 변경 가능 — 새 선택지에 맞는 리액션으로 교체
 */
export default function QuestionPage() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const { hydrated, state, setAnswer } = useSession();
  const [selected, setSelected] = useState<ChoiceKey | null>(null);
  const [reactionVisible, setReactionVisible] = useState(false);

  const stepNum = Number(params.step);
  const validStep = stepNum === 1 || stepNum === 2;
  const stepIdx: StepIndex = stepNum === 2 ? 1 : 0;

  // Validation: persona 없거나 잘못된 step이면 home으로
  useEffect(() => {
    if (!hydrated) return;
    if (!state.personaId || !validStep) {
      router.replace("/demo");
    }
  }, [hydrated, state.personaId, validStep, router]);

  // step이 바뀌면 (예: q1→q2 navigation) 선택과 리액션 초기화
  useEffect(() => {
    setSelected(null);
    setReactionVisible(false);
  }, [stepNum]);

  // 선택이 바뀔 때마다 리액션을 살짝 늦게 띄움 (자연스러운 호흡)
  useEffect(() => {
    if (selected) {
      setReactionVisible(false);
      const t = setTimeout(() => setReactionVisible(true), 280);
      return () => clearTimeout(t);
    } else {
      setReactionVisible(false);
    }
  }, [selected]);

  if (!hydrated || !state.personaId || !validStep) {
    return (
      <StageContainer variant="light">
        <div />
      </StageContainer>
    );
  }

  const persona = getPersona(state.personaId);
  const question = persona.questions[stepIdx];
  const reactionText = selected ? persona.reactions[selected] : "";

  function onNext() {
    if (!selected) return;
    setAnswer(stepIdx, selected);
    if (stepNum === 1) {
      router.push("/demo/q/2");
    } else {
      router.push("/demo/report");
    }
  }

  return (
    <StageContainer variant="light">
      <ProgressBar value={stepNum / 2} label={`${stepNum}/2`} />

      <div className="flex-1 flex flex-col">
        <p className="text-xs font-medium text-brand-500 mb-3 animate-fade-up">
          질문 {stepNum}
        </p>
        <h2 className="text-2xl font-bold tracking-tight leading-snug mb-8 animate-fade-up">
          {question.text}
        </h2>

        <div className="flex flex-col gap-3 animate-fade-up-delay-1">
          {question.choices.map((choice) => {
            const isActive = selected === choice.key;
            return (
              <button
                key={choice.key}
                onClick={() => setSelected(choice.key)}
                className={`
                  text-left p-4 rounded-2xl border transition-all no-select
                  ${
                    isActive
                      ? "bg-brand-50 border-brand-500"
                      : "bg-surface-card border-border-subtle hover:border-brand-200"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      mt-0.5 w-6 h-6 rounded-full flex items-center justify-center
                      text-xs font-semibold flex-shrink-0
                      ${
                        isActive
                          ? "bg-brand-500 text-white"
                          : "bg-white border border-border-subtle text-fg-light-soft"
                      }
                    `}
                  >
                    {choice.key}
                  </div>
                  <p
                    className={`text-base leading-relaxed ${
                      isActive ? "text-fg-light" : "text-fg-light/90"
                    }`}
                  >
                    {choice.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* AI 리액션 버블 — 선택 직후 짧은 호흡 두고 fade-in */}
        <div
          aria-live="polite"
          className={`
            mt-6 transition-all duration-500 ease-out
            ${
              reactionVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            }
          `}
        >
          {selected ? (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <div className="flex-1 bg-brand-50 border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-fg-light leading-relaxed">
                  {reactionText}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <PrimaryButton onClick={onNext} disabled={!selected} className="mt-8">
        {stepNum === 1 ? "다음 질문으로" : "결과 보기"}
      </PrimaryButton>
    </StageContainer>
  );
}
