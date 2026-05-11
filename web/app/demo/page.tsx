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
 * Layout (assets/img/홈3-인터뷰후 reference):
 *   - 외곽 wrapper bg: dark (페이지 전체 다크가 배경)
 *   - 상단 hero: 다크 영역 안에 카피 + 우측 카드 stack 일러스트
 *   - 흰 본문: rounded-t로 hero 위에 살짝 올라온 sheet 결 (-mt + z-10)
 *   - 페르소나 카드 + footer는 흰 본문 영역 안
 *
 * 박람회에서:
 *   - 부스 담당자가 방문자에게 적합한 페르소나를 선택해주거나
 *   - 방문자가 직접 카드 중 하나를 탭해서 시작
 *
 * 진입 시 prior session을 reset.
 */
export default function HomePage() {
  const router = useRouter();
  const { hydrated, setPersona, reset } = useSession();
  const { reset: resetConversation } = useConversation({ namespace: "demo" });

  useEffect(() => {
    if (hydrated) {
      reset();
      resetConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function selectPersona(id: PersonaId) {
    setPersona(id);
    router.push("/demo/welcome");
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-dark lg:bg-gradient-to-b lg:from-surface-dark lg:to-[#1a1235]">
      <div className="w-full max-w-md flex flex-col bg-surface-dark text-fg-dark lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-2xl lg:shadow-black/40 overflow-hidden relative">
        {/* Dark hero — 외곽 wrapper와 같은 다크 bg. 카피 + 우측 카드 stack 일러스트. */}
        <header className="gradient-hero px-6 pt-14 pb-16 relative animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-fg-dark mb-4 leading-snug">
                나에게 집중하는 시간,
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight leading-[1.1]">
                Being
                <br />
                myself
              </h1>
            </div>
            <Image
              src="/img/cover-hero.png"
              alt=""
              width={128}
              height={128}
              priority
              className="w-[128px] h-auto flex-shrink-0 mt-2"
            />
          </div>
        </header>

        {/* 흰 본문 — rounded-t로 hero 위에 살짝 올라옴 (-mt + z-10). */}
        <div className="bg-surface-light text-fg-light rounded-t-[2rem] -mt-6 flex-1 flex flex-col relative z-10 pt-8 pb-8 px-6">
          <p className="text-sm font-medium text-fg-light-soft mb-4 animate-fade-up-delay-1">
            누구로 시작하시겠어요?
          </p>

          <section className="flex-1 flex flex-col gap-4">
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
            Copyright © 2026 MOBINITY. All Rights Reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
