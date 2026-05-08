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
 * 선택지 카드 3개 → 하나 선택 → "다음" 버튼 활성화 → 답변 저장 → 다음 화면.
 */
export default function QuestionPage() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const { hydrated, state, setAnswer } = useSession();
  const [selected, setSelected] = useState<ChoiceKey | null>(null);

  const stepNum = Number(params.step);
  const validStep = stepNum === 1 || stepNum === 2;
  const stepIdx: StepIndex = stepNum === 2 ? 1 : 0;

  // Validation: persona 없거나 잘못된 step이면 home으로
  useEffect(() => {
    if (!hydrated) return;
    if (!state.personaId || !validStep) {
      router.replace("/");
    }
  }, [hydrated, state.personaId, validStep, router]);

  if (!hydrated || !state.personaId || !validStep) {
    return <StageContainer variant="light"><div /></StageContainer>;
  }

  const persona = getPersona(state.personaId);
  const question = persona.questions[stepIdx];

  function onNext() {
    if (!selected) return;
    setAnswer(stepIdx, selected);
    if (stepNum === 1) {
      router.push("/q/2");
    } else {
      router.push("/report");
    }
  }

  return (
    <StageContainer variant="light">
      <ProgressBar value={stepNum / 2} label={`${stepNum}/2`} />

      <div className="flex-1 flex flex-col">
        <p className="text-xs font-medium text-brand-500 mb-3">
          질문 {stepNum}
        </p>
        <h2 className="text-2xl font-bold tracking-tight leading-snug mb-8">
          {question.text}
        </h2>

        <div className="flex flex-col gap-3">
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
      </div>

      <PrimaryButton
        onClick={onNext}
        disabled={!selected}
        className="mt-8"
      >
        {stepNum === 1 ? "다음 질문으로" : "결과 보기"}
      </PrimaryButton>
    </StageContainer>
  );
}
