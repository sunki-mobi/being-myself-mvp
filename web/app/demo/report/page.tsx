"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getPersona } from "@/lib/personas";
import { getBaseline } from "@/lib/me/baselines";
import { DemoReportStage } from "@/components/DemoReportStage";

/**
 * /demo/report — 박람회 게스트 보고서.
 *
 * /me/report와 다르게 digest LLM 호출 없음 (페르소나 baseline이 [TODO]라
 * connections·tension fabrication 위험). 오늘 답변 정리(answer-card LLM ×2) +
 * "장기 누적 미리보기"로 풀 baseline 보고서 진입 CTA만.
 */
export default function DemoReportPage() {
  const router = useRouter();
  const { state, hydrated } = useSession();

  const personaId = state.personaId;
  const persona = personaId ? getPersona(personaId) : null;

  // 페르소나 없으면 /demo로
  useEffect(() => {
    if (hydrated && !personaId) {
      router.replace("/demo");
    }
  }, [hydrated, personaId, router]);

  if (!hydrated || !persona) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const baseline = getBaseline(persona.baselineId);

  return (
    <DemoReportStage
      baseline={baseline}
      conversationOptions={{
        namespace: "demo",
        baselineId: persona.baselineId,
      }}
      onBack={() => router.push("/demo")}
      fullReportPath="/demo/report/full"
      newSessionPath="/demo/conversation"
      homePath="/demo"
    />
  );
}
