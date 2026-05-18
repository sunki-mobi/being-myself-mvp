"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@/lib/conversation";
import { ConversationStage } from "@/components/ConversationStage";

/**
 * /me/conversation client wrapper.
 *
 * server에서 받은 todayQaCount와 LocalStorage state 비교:
 *   - state.isComplete=true 인데 todayQaCount=0이면 → LocalStorage 옛 state
 *     남은 상황 (DB 비웠거나 다른 디바이스). 자동 reset해서 새 세션 시작.
 *   - state.messages.length > 0 인데 todayQaCount=0도 같은 케이스 → reset.
 *
 * 디바이스 간 동기화는 V1에서는 LocalStorage 보존. server qa_pair가 source
 * of truth이므로 server count=0이면 LocalStorage도 reset이 맞음.
 */
export function ConversationPageClient({
  todayQaCount,
}: {
  todayQaCount: number;
}) {
  const router = useRouter();
  const conversationOptions = {
    namespace: "me" as const,
    persistTurns: true,
  };
  const { state, hydrated, reset } = useConversation(conversationOptions);
  const resetCheckedRef = useRef(false);

  // 1회만 — hydrated 직후 state vs server count mismatch면 reset
  useEffect(() => {
    if (!hydrated || resetCheckedRef.current) return;
    resetCheckedRef.current = true;

    const localHasState = state.isComplete || state.messages.length > 0;
    if (localHasState && todayQaCount === 0) {
      console.log(
        "[/me/conversation] LocalStorage state mismatch with server (todayQaCount=0) — resetting",
      );
      reset();
    }
  }, [hydrated, state.isComplete, state.messages.length, todayQaCount, reset]);

  // 사용자 이름이 없으면 /me로
  useEffect(() => {
    if (hydrated && !state.userName) {
      router.replace("/me");
    }
  }, [hydrated, state.userName, router]);

  if (!hydrated || !state.userName) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  return (
    <ConversationStage
      conversationOptions={conversationOptions}
      userNameDisplay={state.userName}
      onBack={() => router.push("/me/do")}
      completePath="/me/report?fresh=1"
    />
  );
}
