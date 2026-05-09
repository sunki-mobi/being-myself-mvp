"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConversation, QUESTION_POOL } from "@/lib/conversation";
import { StageContainer } from "@/components/StageContainer";
import { PrimaryButton, SecondaryButton } from "@/components/PrimaryButton";

/**
 * /me/conversation — 자유 텍스트 Q&A
 *
 * 흐름:
 *   1. AI 질문 → 사용자가 텍스트 입력 → 제출
 *   2. AI 짧은 리액션 + 다음 질문
 *   3. QUESTION_POOL 끝까지 반복
 *   4. 모든 답변 완료 후 "오늘은 여기까지" + 보고서로 이동 옵션
 *
 * Phase B에서는:
 *   - QUESTION_POOL이 사용자의 셀프인터뷰 데이터 + 이전 답변 컨텍스트
 *     기반으로 Claude API 호출로 동적 생성
 *   - 텍스트 외에 음성 입력도 지원
 */
export default function ConversationPage() {
  const router = useRouter();
  const { state, hydrated, startConversation, submitAnswer, isComplete } =
    useConversation();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 사용자 이름이 없으면 /me로 보냄
  useEffect(() => {
    if (hydrated && !state.userName) {
      router.replace("/me");
    }
  }, [hydrated, state.userName, router]);

  // 첫 진입 시 첫 질문 띄움
  useEffect(() => {
    if (hydrated && state.userName && state.messages.length === 0) {
      startConversation();
    }
  }, [hydrated, state.userName, state.messages.length, startConversation]);

  // 새 메시지 들어올 때마다 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages.length]);

  if (!hydrated || !state.userName) {
    return (
      <StageContainer variant="light">
        <div />
      </StageContainer>
    );
  }

  function onSubmit() {
    if (!draft.trim()) return;
    submitAnswer(draft);
    setDraft("");
  }

  // 마지막 메시지가 ai-question이면 사용자가 답할 차례
  const lastMessage = state.messages[state.messages.length - 1];
  const awaitingAnswer = lastMessage?.role === "ai-question";

  const answeredCount = state.messages.filter(
    (m) => m.role === "user-answer"
  ).length;

  return (
    <StageContainer variant="light">
      {/* 진행 표시 */}
      <div className="mb-4 flex items-center justify-between text-xs text-fg-light-soft">
        <span>
          <span className="font-semibold text-fg-light">{state.userName}</span>
          님과의 대화
        </span>
        <span>
          {answeredCount}/{QUESTION_POOL.length}
        </span>
      </div>

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4"
      >
        {state.messages.map((m, idx) => {
          if (m.role === "ai-question") {
            return (
              <div key={idx} className="flex items-start gap-3 animate-fade-up">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-surface-dark flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <div className="flex-1 bg-surface-card rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-base text-fg-light leading-relaxed">
                    {m.text}
                  </p>
                </div>
              </div>
            );
          }
          if (m.role === "ai-reaction") {
            return (
              <div key={idx} className="flex items-start gap-3 animate-fade-up">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <div className="flex-1 bg-brand-50 border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-fg-light leading-relaxed">
                    {m.text}
                  </p>
                </div>
              </div>
            );
          }
          // user-answer
          return (
            <div key={idx} className="flex justify-end animate-fade-up">
              <div className="max-w-[85%] bg-fg-light text-white rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.text}
                </p>
              </div>
            </div>
          );
        })}

        {/* 완료 시 안내 */}
        {isComplete ? (
          <div className="mt-4 p-5 rounded-3xl bg-brand-50 border border-brand-100 animate-fade-up">
            <p className="text-base font-semibold text-fg-light mb-2">
              오늘은 여기까지예요.
            </p>
            <p className="text-sm text-fg-light-soft leading-relaxed">
              {state.userName}님이 나눈 이야기가 보고서에 정리되었어요.
              <br />
              지금까지의 답변이 어떻게 모이는지 함께 보실까요?
            </p>
          </div>
        ) : null}
      </div>

      {/* 입력 영역 또는 보고서 이동 */}
      {isComplete ? (
        <div className="mt-4 flex flex-col gap-3">
          <PrimaryButton onClick={() => router.push("/me/report")}>
            보고서 보기
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/me")}>
            처음으로
          </SecondaryButton>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              awaitingAnswer
                ? "짧게 한 문장이어도 좋아요"
                : "잠시만요..."
            }
            disabled={!awaitingAnswer}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-border-subtle bg-surface-card focus:bg-white focus:border-brand-500 outline-none text-base resize-none transition-colors disabled:opacity-50"
          />
          <PrimaryButton
            onClick={onSubmit}
            disabled={!awaitingAnswer || !draft.trim()}
          >
            보내기
          </PrimaryButton>
        </div>
      )}
    </StageContainer>
  );
}
