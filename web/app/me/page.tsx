"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@/lib/conversation";
import { StageContainer } from "@/components/StageContainer";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";

/**
 * /me — 원래 기능 트랙 진입점 (Phase B placeholder)
 *
 * 박람회 후 Phase B에서:
 *   - 실제 Google OAuth로 대체
 *   - 사용자의 셀프인터뷰 데이터를 자동 로드
 *   - Claude API로 컨텍스트 기반 질문 생성
 *
 * 현재 (Day 2):
 *   - mock login (이름 입력 → sessionStorage)
 *   - 입장 후 /me/conversation으로 이동
 */
export default function MeLandingPage() {
  const router = useRouter();
  const { state, hydrated, login, reset } = useConversation();
  const [name, setName] = useState(state.userName ?? "");

  function onStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    login(trimmed);
    router.push("/me/conversation");
  }

  function onResetAndStartOver() {
    reset();
    setName("");
  }

  if (!hydrated) {
    return (
      <StageContainer variant="light">
        <div />
      </StageContainer>
    );
  }

  // 이미 진행 중인 세션이 있으면 "이어가기" 옵션
  const hasOngoing = state.messages.length > 0;

  return (
    <StageContainer variant="light">
      <section className="mb-8 mt-2 animate-fade-up">
        <p className="text-sm text-fg-light-soft mb-2">내 데이터로 시작하기</p>
        <h1 className="text-3xl font-bold tracking-tight">
          나의 페이스메이커
        </h1>
        <p className="mt-3 text-sm text-fg-light-soft leading-relaxed">
          하루 5분, AI와 대화하며
          <br />
          나의 소명을 더 깊이 발견해가는 시간이에요.
        </p>
      </section>

      <div className="flex justify-center my-4 animate-fade-up-delay-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/legacy/image (9).png"
          alt=""
          aria-hidden
          className="w-40 h-40 object-contain"
        />
      </div>

      {hasOngoing ? (
        <section className="flex-1 flex flex-col gap-4 animate-fade-up-delay-2">
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
            <p className="text-sm text-fg-light leading-relaxed">
              <span className="font-semibold">{state.userName ?? "사용자"}</span>
              님, 진행 중인 대화가 있어요.
              <br />
              <span className="text-fg-light-soft text-xs">
                {state.messages.filter((m) => m.role === "user-answer").length}
                개 답변 누적됨
              </span>
            </p>
          </div>
          <PrimaryButton onClick={() => router.push("/me/conversation")}>
            대화 이어가기
          </PrimaryButton>
          <SecondaryButton onClick={onResetAndStartOver}>
            새로 시작하기
          </SecondaryButton>
        </section>
      ) : (
        <section className="flex-1 flex flex-col gap-4 animate-fade-up-delay-2">
          <div>
            <label className="block text-sm font-medium text-fg-light-soft mb-2">
              어떻게 불러드릴까요?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 또는 별명"
              className="w-full px-4 py-3 rounded-2xl border border-border-subtle bg-surface-card focus:bg-white focus:border-brand-500 outline-none text-base transition-colors"
              maxLength={20}
            />
            <p className="text-xs text-fg-light-soft mt-2">
              Phase B에서는 Google 계정으로 자동 연결됩니다.
            </p>
          </div>
          <PrimaryButton onClick={onStart} disabled={!name.trim()}>
            시작하기
          </PrimaryButton>
        </section>
      )}

      <p className="text-center text-xs text-fg-light-soft mt-8">
        Being Myself · Phase B preview
      </p>
    </StageContainer>
  );
}
