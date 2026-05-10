"use client";

import { useRouter } from "next/navigation";
import { ReportStage } from "@/components/ReportStage";
import { BASELINE_REPORT } from "@/lib/me/baseline-report";

/**
 * /me/report — 방선기 본인 시연 트랙의 오늘 보고서.
 */
export default function MeReportPage() {
  const router = useRouter();
  return (
    <ReportStage
      baseline={BASELINE_REPORT}
      conversationOptions={{ namespace: "me" }}
      onBack={() => router.push("/me")}
      fullReportPath="/me/report/full"
      newSessionPath="/me/conversation"
      homePath="/me"
    />
  );
}
