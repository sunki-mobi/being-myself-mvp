import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LONG_TERM_PREVIEWS } from "@/lib/me/long-term-previews";
import { LongTermReportClient } from "./LongTermReportClient";

/**
 * /me/long-term — "지금까지의 모습" 4단계 누적 보고서.
 *
 * 11명 실 사용자 오픈 직전 단계 — 본인 누적 합성은 충분한 답변이 쌓인 뒤
 * 활성화 예정. 현재는 정다은(worker) 페르소나 preview를 양식 미리보기로
 * 표시하고 상단 "이후 공개 예정" 안내. 인증된 사용자만 진입 가능.
 *
 * 이후 본인 누적 합성 활성화 시 baseline_report + qa_pair 누적 기반
 * synthesizeAndSaveLongTermReport로 복원.
 */
export default async function MeLongTermPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/long-term");

  const report = LONG_TERM_PREVIEWS.worker;

  return (
    <LongTermReportClient
      report={report}
      pendingAnswers={0}
      isStale={false}
      isPreview
    />
  );
}
