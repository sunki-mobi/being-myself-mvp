"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useConversation } from "@/lib/conversation";
import { PERSONAS, PERSONA_ORDER } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";

/**
 * S-02 페르소나 선택 (홈 화면)
 *
 * 박람회에서:
 *   - 부스 담당자가 방문자에게 적합한 페르소나를 선택해주거나
 *   - 방문자가 직접 카드 중 하나를 탭해서 시작
 *   - 두 경우 모두 같은 화면을 사용 (D5 결정 — 단일 선택창)
 *
 * 진입 시 prior session을 reset하여 다음 방문자가 깨끗한 상태로 시작.
 *
 * Layout: 디자인 시스템 reference(홈4-인터뷰후2)와 일관 — 다크 보라 hero
 * (rounded-b) + 우측 카드 stack 일러스트 + 흰 bg 페르소나 카드들. cover와
 * 같은 외곽 (max-w-md + lg:rounded-3xl).
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
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        {/* Dark hero — 카피 + 카드 stack 일러스트 (디자인 시스템 reference) */}
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-10 rounded-b-[2rem] relative animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-fg-dark-soft tracking-wide mb-3">
                하루 5분, 나에게 집중하는 시간
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                Being myself
                <br />

              </h1>
              <p className="mt-4 text-sm text-fg-dark-soft leading-relaxed">
                오늘 단 두 가지 질문으로
                <br />
                나의 소명을 발견해보세요.
              </p>
            </div>
            <Image
              src="/img/cover-hero.png"
              alt=""
              width={108}
              height={108}
              priority
              className="w-[108px] h-auto flex-shrink-0 mt-2"
            />
          </div>
        </header>

        {/* 본문 — 페르소나 카드 */}
        <section className="flex-1 flex flex-col gap-4 px-6 pt-8 pb-6">
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

        <p className="text-center text-xs text-fg-light-soft pb-8 px-6">
          © 2026 MOBINITY. All Rights Reserved.
        </p>
      </div>
    </main>
  );
}
