"use client";

import { useRouter } from "next/navigation";
import { ReportStage } from "@/components/ReportStage";
import type { BaselineReport } from "@/lib/me/baseline-report";

/**
 * /me/report client island — server component에서 사용자별 baseline을 받아
 * ReportStage에 전달. useConversation은 namespace="me", persistTurns=true.
 */
export function MeReportClient({ baseline }: { baseline: BaselineReport }) {
  const router = useRouter();
  return (
    <ReportStage
      baseline={baseline}
      conversationOptions={{ namespace: "me", persistTurns: true }}
      onBack={() => router.push("/me")}
      fullReportPath="/me/report/full"
      newSessionPath="/me/conversation"
      homePath="/me"
    />
  );
}
