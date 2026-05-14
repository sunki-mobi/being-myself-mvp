/**
 * 셀프인터뷰 → BaselineReport 합성 결과의 간소화 shape.
 *
 * baseline_report.report 컬럼에 JSON으로 저장되는 사용자별 본문. `web/lib/me/
 * baseline-report.ts`의 풀 BaselineReport(SKPAN)와 달리, 본문에 필요한 핵심만:
 *   - headline 한 줄
 *   - 3 Part(가치 있는 것 / 좋아하는 것 / 잘하는 것) 각각의 items·insight·keywords
 *
 * preface·examples·closing 같은 고정 카피는 컴포넌트 측 템플릿에서 채움 → 합성
 * 비용·LLM 토큰 절감.
 */

export const BASELINE_PART_TITLES = [
  "가치 있는 것",
  "좋아하는 것",
  "잘하는 것",
] as const;

export type BaselinePartTitle = (typeof BASELINE_PART_TITLES)[number];

export type BaselineItemShape = {
  title: string;
  description: string[];
};

export type BaselinePartShape = {
  partTitle: BaselinePartTitle;
  items: BaselineItemShape[];
  insight: string;
  keywords: string[];
};

export type BaselineShape = {
  headline: string;
  parts: BaselinePartShape[];
};

/**
 * BaselineShape를 LLM prompt 컨텍스트용 텍스트 요약으로 변환.
 *
 * 본인 baseline_report.report(BaselineShape) → headline + parts(키워드·인사이트)
 * 한 줄 list. /api/me/chat·/api/me/digest 등에서 prompt에 주입할 때 사용.
 */
export function summarizeBaselineShape(shape: BaselineShape): string {
  const lines: string[] = [
    `한 줄 요약: ${shape.headline}`,
    "",
    "[3개 Part]",
  ];
  for (const part of shape.parts) {
    lines.push(`- ${part.partTitle}`);
    if (part.keywords && part.keywords.length > 0) {
      lines.push(`  키워드: ${part.keywords.join(", ")}`);
    }
    if (part.insight) {
      lines.push(`  인사이트: ${part.insight}`);
    }
    if (part.items && part.items.length > 0) {
      const itemTitles = part.items
        .map((it) => it.title)
        .filter(Boolean)
        .join(" / ");
      if (itemTitles) lines.push(`  세부: ${itemTitles}`);
    }
  }
  return lines.join("\n");
}
