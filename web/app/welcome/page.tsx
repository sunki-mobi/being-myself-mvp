"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getPersona } from "@/lib/personas";
import { StageContainer } from "@/components/StageContainer";
import { PrimaryButton } from "@/components/PrimaryButton";

/**
 * S-03 게스트 진입 화면
 *
 * 페르소나 맞춤 환영 메시지 + 시작하기 버튼.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { hydrated, state } = useSession();

  // 페르소나가 안 잡혀 있으면 홈으로 보냄 (직접 URL 접근 방어)
  useEffect(() => {
    if (hydrated && !state.personaId) {
      router.replace("/");
    }
  }, [hydrated, state.personaId, router]);

  if (!hydrated || !state.personaId) {
    return <StageContainer variant="light"><div /></StageContainer>;
  }

  const persona = getPersona(state.personaId);

  return (
    <StageContainer variant="light">
      <div className="flex-1 flex flex-col">
        <div className="mt-2 animate-fade-up">
          <p className="text-sm text-fg-light-soft mb-3">반갑습니다</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {persona.name}
            <span className="text-fg-light-soft text-xl font-normal">
              {" "}
              · {persona.role}
            </span>
          </h1>
        </div>

        {/* Character illustration — 자기성찰 테마 */}
        <div className="flex justify-center my-6 animate-fade-up-delay-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/legacy/image (9).png"
            alt=""
            aria-hidden
            className="w-44 h-44 object-contain"
          />
        </div>

        <div
          className="p-6 rounded-3xl animate-fade-up-delay-2"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
          }}
        >
          <p className="text-base leading-relaxed text-fg-light">
            {persona.welcome}
          </p>
        </div>

        <p className="mt-6 text-sm text-fg-light-soft leading-relaxed animate-fade-up-delay-3">
          오늘은 두 가지 질문으로
          <br />
          나의 소명을 발견해보는 시간이에요.
          <br />
          <span className="text-fg-light-soft/70">짧게, 한 문장이어도 좋아요.</span>
        </p>
      </div>

      <PrimaryButton onClick={() => router.push("/q/1")} className="mt-6 animate-fade-up-delay-3">
        시작하기
      </PrimaryButton>
    </StageContainer>
  );
}
