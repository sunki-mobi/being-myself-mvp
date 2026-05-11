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
 *   - 외곽 main bg: 라벤더 (cover와 같은 결)
 *   - 카드 wrapper: 흰 max-w-md + rounded-3xl + shadow-xl (overflow-hidden으로
 *     hero·본문 모서리 자동 다듬음)
 *   - 카드 안 상단 hero: 다크 보라 그라데이션 + 우상단 보라 ambient blur
 *     + 좌측 카피 + 우측 카드 stack 일러스트
 *   - 카드 안 하단: 흰 본문 (페르소나 카드 + footer)
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
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        {/* Dark hero — 카드 안 상단. 보라 그라데이션 + 우상단 ambient. */}
        <header
          className="text-fg-dark px-6 pt-12 pb-12 relative overflow-hidden animate-fade-up"
          style={{
            background:
              "linear-gradient(135deg, #1e1a34 0%, #2a1b5c 60%, #3a1d6e 100%)",
          }}
        >
          {/* 우상단 보라 ambient — reference 톤 */}
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--brand-400) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg-dark mb-3 leading-snug">
                나에게 집중하는 시간,
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                Being myself
              </h1>
            </div>
            <Image
              src="/img/cover-hero.png"
              alt=""
              width={120}
              height={120}
              priority
              className="w-[120px] h-auto flex-shrink-0"
            />
          </div>
        </header>

        {/* 흰 본문 — 페르소나 카드 */}
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
          Copyright © 2026 MOBINITY. All Rights Reserved.
        </p>
      </div>
    </main>
  );
}
