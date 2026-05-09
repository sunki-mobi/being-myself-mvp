"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, deriveDirection } from "@/lib/session";
import { getPersona } from "@/lib/personas";
import type { ChoiceKey, Direction } from "@/lib/types";
import { StageContainer } from "@/components/StageContainer";
import { SecondaryButton } from "@/components/PrimaryButton";

function fillSlots(
  template: string,
  slots: { choice1?: string; choice2?: string }
): string {
  return template
    .replaceAll("{choice1}", slots.choice1 ?? "")
    .replaceAll("{choice2}", slots.choice2 ?? "");
}

/**
 * S-08 보고서 화면
 *
 * 와우 모먼트는 상단 dark hero에 박힌 한 줄 헤드라인:
 *   "내가 진정 하고 싶은 일은 '{q1 선택지}'와 '{q2 선택지}'가 만나는 자리입니다."
 *
 * Echo-back: q1, q2에서 사용자가 고른 label을 그대로 헤드라인 슬롯에 넣음.
 * 페르소나 + 방향(direction1/2)에 따라 보고서 본문 6종 중 하나가 선택됨.
 */
export default function ReportPage() {
  const router = useRouter();
  const { hydrated, state, reset } = useSession();

  // 답이 다 안 차 있으면 home으로 보냄 (직접 URL 접근 방어)
  useEffect(() => {
    if (!hydrated) return;
    if (!state.personaId || !state.answers.q1 || !state.answers.q2) {
      router.replace("/");
    }
  }, [hydrated, state, router]);

  const data = useMemo(() => {
    if (!state.personaId || !state.answers.q1 || !state.answers.q2) return null;
    const persona = getPersona(state.personaId);
    const q1Choice = persona.questions[0].choices.find(
      (c) => c.key === state.answers.q1
    )!;
    const q2Choice = persona.questions[1].choices.find(
      (c) => c.key === state.answers.q2
    )!;
    const direction: Direction = deriveDirection(
      q1Choice.direction,
      q2Choice.direction
    );
    const report =
      direction === 1 ? persona.reports.direction1 : persona.reports.direction2;
    const headline = fillSlots(report.headline, {
      choice1: q1Choice.label,
      choice2: q2Choice.label,
    });
    return { persona, report, headline, direction };
  }, [state]);

  function onReset() {
    reset();
    router.push("/");
  }

  if (!hydrated || !data) {
    return <StageContainer variant="light"><div /></StageContainer>;
  }

  const { persona, report, headline } = data;

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:overflow-hidden lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Dark hero — 와우 모먼트가 박히는 곳 */}
        <section className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] animate-fade-up">
          <p className="text-xs font-medium text-fg-dark-soft mb-3">
            {persona.name} · {persona.role}
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            {headline}
          </h1>
          <p className="mt-4 text-sm text-fg-dark-soft leading-relaxed">
            다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠.
          </p>
        </section>

        {/* Body — Part 1/2/3 */}
        <section className="flex-1 px-6 py-10 flex flex-col gap-8">
          {report.parts.map((part, idx) => {
            const delayClass =
              idx === 0
                ? "animate-fade-up-delay-1"
                : idx === 1
                  ? "animate-fade-up-delay-2"
                  : "animate-fade-up-delay-3";
            return (
              <article key={idx} className={delayClass}>
                <p className="text-xs font-medium text-brand-500 mb-2">
                  #셀프인터뷰
                </p>
                <h3 className="text-xl font-bold mb-3">{part.heading}</h3>
                <p className="text-base leading-relaxed text-fg-light/85 whitespace-pre-wrap">
                  {part.body}
                </p>
              </article>
            );
          })}

          {/* Insight + keywords */}
          <article
            className="p-5 rounded-3xl animate-fade-up-delay-3"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
            }}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden className="text-xl leading-none">💡</span>
              <p className="text-base leading-relaxed text-fg-light flex-1">
                {report.insight}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 rounded-full bg-white/60 text-xs font-medium text-fg-light"
                >
                  {kw}
                </span>
              ))}
            </div>
          </article>
        </section>

        {/* 명상 일러스트 — "잠시 머무는 시간" */}
        <div className="flex justify-center pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/legacy/image (15).png"
            alt=""
            aria-hidden
            className="w-32 h-32 object-contain"
          />
        </div>

        {/* Reset CTA — 다음 방문자를 위해 */}
        <section className="px-6 pb-10">
          <SecondaryButton onClick={onReset}>처음으로</SecondaryButton>
          <p className="text-center text-xs text-fg-light-soft mt-4">
            Being Myself MVP · 모비니티 온톨로지
          </p>
        </section>
      </div>
    </main>
  );
}
