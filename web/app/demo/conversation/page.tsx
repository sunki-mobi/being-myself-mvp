"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useConversation } from "@/lib/conversation";
import { getPersona } from "@/lib/personas";
import { ConversationStage } from "@/components/ConversationStage";

/**
 * /demo/conversation — 박람회 게스트 conversation 흐름.
 *
 * 페르소나 baseline 컨텍스트로 LLM 페이스메이커가 두 질문 던짐. 게스트가 자유
 * 텍스트 또는 음성으로 답변. /demo/report로 이어짐.
 *
 * 진입 시 페르소나 ID가 없으면 /demo로 redirect (직접 URL 접근 방어).
 * useConversation의 namespace를 "demo"로 분기하여 /me 트랙 데이터를 침범하지 않음.
 */
export default function DemoConversationPage() {
  const router = useRouter();
  const { state: sessionState, hydrated: sessionHydrated } = useSession();

  const personaId = sessionState.personaId;
  const persona = personaId ? getPersona(personaId) : null;

  const { hydrated: convHydrated, login, state: convState } = useConversation({
    namespace: "demo",
    baselineId: persona?.baselineId,
    mode: "demo",
    hardcodedQuestions: persona?.questions,
    hardcodedWelcome: persona?.welcome,
  });

  // 페르소나 없으면 /demo로
  useEffect(() => {
    if (sessionHydrated && !personaId) {
      router.replace("/demo");
    }
  }, [sessionHydrated, personaId, router]);

  // 페르소나 있으면 자동 login (페르소나 이름으로) — pacemaker가 호명할 때 사용
  useEffect(() => {
    if (convHydrated && persona && !convState.userName) {
      login(persona.name);
    }
  }, [convHydrated, persona, convState.userName, login]);

  // login useEffect가 storage에 userName 박은 다음에야 ConversationStage 진입.
  // 안 그러면 ConversationStage 안 useConversation이 storage에서 빈 userName 읽고
  // !state.userName 가드로 빈 화면만 보여줌.
  if (!sessionHydrated || !convHydrated || !persona || !convState.userName) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  return (
    <ConversationStage
      conversationOptions={{
        namespace: "demo",
        baselineId: persona.baselineId,
        mode: "demo",
        hardcodedQuestions: persona.questions,
        hardcodedWelcome: persona.welcome,
      }}
      userNameDisplay={persona.name}
      onBack={() => router.push("/demo")}
      completePath="/demo/report"
    />
  );
}
