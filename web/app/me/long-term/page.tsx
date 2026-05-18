import { redirect } from "next/navigation";

/**
 * /me/long-term — "지금까지의 모습" 4단계 누적 보고서.
 *
 * V4부터는 /me/report?tab=long-term 으로 통합. 이 route는 기존 link 호환용.
 */
export default function MeLongTermPage() {
  redirect("/me/report?tab=long-term");
}
