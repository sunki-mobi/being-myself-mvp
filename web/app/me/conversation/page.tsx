"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@/lib/conversation";
import { ConversationStage } from "@/components/ConversationStage";

/**
 * /me/conversation — 방선기 본인 시연 트랙의 conversation 흐름.
 * baseline은 server route default (skpan).
 */
export default function MeConversationPage() {
  const router = useRouter();
  // /me는 로그인 사용자 트랙 — proxy가 이미 인증 가드. persistTurns로 매 turn DB 누적.
  const conversationOptions = { namespace: "me" as const, persistTurns: true };
  const { state, hydrated } = useConversation(conversationOptions);

  // 사용자 이름이 없으면 /me로 보냄
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
      onBack={() => router.push("/me")}
      completePath="/me/report"
    />
  );
}
