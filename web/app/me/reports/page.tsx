import { redirect } from "next/navigation";

/**
 * /me/reports — 옛 hub (셀프인터뷰·장기·답변·일기 4 카드).
 *
 * V4부터 3가지(셀프인터뷰·장기·답변)는 /me/report tab으로 합쳐졌고
 * 일기는 /me/diary 직링크라 hub 필요 없음. 기존 link 호환용 redirect.
 */
export default function MeReportsHubPage() {
  redirect("/me/report");
}
