"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useConversation } from "@/lib/conversation";
import { PERSONAS, PERSONA_ORDER } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";
import { StageContainer } from "@/components/StageContainer";

/**
 * S-02 페르소나 선택 (홈 화면)
 *
 * 박람회에서:
 *   - 부스 담당자가 방문자에게 적합한 페르소나를 선택해주거나
 *   - 방문자가 직접 카드 중 하나를 탭해서 시작
 *   - 두 경우 모두 같은 화면을 사용 (D5 결정 — 단일 선택창)
 *
 * 진입 시 prior session을 reset하여 다음 방문자가 깨끗한 상태로 시작.
 */
export default function HomePage() {
  const router = useRouter();
  const { hydrated, setPersona, reset } = useSession();
  // /demo namespace의 conversation storage도 함께 reset — 게스트 시연마다
  // 이전 답변·질문 자취가 남지 않도록.
  const { reset: resetConversation } = useConversation({ namespace: "demo" });

  useEffect(() => {
    if (hydrated) {
      reset();
      resetConversation();
    }
    // hydrated가 true가 된 시점에 한 번만 reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function selectPersona(id: PersonaId) {
    setPersona(id);
    router.push("/demo/welcome");
  }

  return (
    <StageContainer variant="light">
      {/* Hero — 차분한 텍스트만, 페르소나 카드가 시각 무게 담당 */}
      <section className="mb-10 mt-4 animate-fade-up">
        <p className="text-sm text-fg-light-soft mb-2">
          하루 5분, 나를 정리하는 시간
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Being myself</h1>
        <p className="mt-4 text-base text-fg-light-soft leading-relaxed">
          오늘 단 두 가지 질문으로
          <br />
          나의 소명을 발견해보세요.
        </p>
      </section>

      {/* Persona cards */}
      <section className="flex-1 flex flex-col gap-4">
        <p className="text-sm font-medium text-fg-light-soft mb-1 animate-fade-up-delay-1">
          누구로 시작하시겠어요?
        </p>
        {PERSONA_ORDER.map((id, idx) => {
          const p = PERSONAS[id];
          const delayClass =
            idx === 0
              ? "animate-fade-up-delay-1"
              : idx === 1
                ? "animate-fade-up-delay-2"
                : "animate-fade-up-delay-3";
          return (
            <button
              key={id}
              onClick={() => selectPersona(id)}
              className={`text-left p-5 rounded-[12px] shadow-card hover:shadow-button active:scale-[0.99] transition-all no-select ${delayClass}`}
              style={{
                backgroundImage: `linear-gradient(${135 + idx * 30}deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)`,
              }}
            >
              <div className="text-xs font-medium text-fg-light-soft mb-2">
                #{p.role}
              </div>
              <div className="text-xl font-semibold text-fg-light mb-1">
                {p.name}{" "}
                <span className="text-fg-light-soft text-base font-normal">
                  · {p.age}세
                </span>
              </div>
              <div className="text-sm text-fg-light/80">{p.tagline}</div>
            </button>
          );
        })}
      </section>

      <p className="text-center text-xs text-fg-light-soft mt-8">
        Being Myself MVP · 모비니티 온톨로지
      </p>
    </StageContainer>
  );
}
