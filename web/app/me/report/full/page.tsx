import { redirect } from "next/navigation";

/**
 * /me/report/full — 셀프인터뷰 보고서 본문.
 *
 * V4부터는 /me/report?tab=interview 로 통합. 이 route는 기존 link
 * (이메일·공유 url 등) 호환을 위해 redirect만 수행.
 */
export default function MeReportFullPage() {
  redirect("/me/report?tab=interview");
}
