/**
 * 6개월 누적 보고서 — 4단계 층위 양식.
 *
 * 모비니티 온톨로지 + 기획안 §8.1 4단계 모델 (현상·본질·가치·존재)을 그대로
 * schema로. /demo/report/full에서는 페르소나별 hardcoded preview, /me/report/full
 * (박람회 후)에서는 사용자 누적 답변에서 합성.
 *
 * `BaselineReport`(좋아하는·잘하는·가치 3 Part)는 첫 셀프인터뷰 시드 전용으로
 * 위치 변경. 본 보고서는 이 type.
 *
 * Design doc: skpan-master-design-20260510-191649.md
 */

export type LongTermLayer = "현상" | "본질" | "가치" | "존재";

export type LongTermQuote = {
  /** 첫 답변(Day 1) 기준 며칠째에 들어온 답변인지 */
  day: number;
  text: string;
};

export type LongTermLayerCard = {
  layer: LongTermLayer;
  /** "이 사람의 일상", "움직이는 결" 등 — 박람회 게스트 친화 라벨 */
  friendlyTitle: string;
  /** 잡지 톤 정리 한 단락 (3-4문장) */
  summary: string;
  /** 사용자 답변 원문 인용 — 결을 입증하는 두 조각 */
  quotes: LongTermQuote[];
  /** 그 단계의 핵심 키워드 2-3개. hero 키워드 대시보드와 매핑 */
  keywords: string[];
};

export type LongTermReport = {
  userName: string;
  /** echo-back headline 한 줄 — 누적 답변이 응축된 소명 */
  headline: string;
  /** 5-10개. 성격·강점·가치·결 — hero 대시보드 */
  keywords: string[];
  /** 누적 답변 수 (예: 247) */
  totalAnswers: number;
  /** 첫 답변 ~ 오늘 일수 (예: 180) */
  daySpan: number;
  /** 4단계 카드 — 현상·본질·가치·존재 순서 */
  layers: LongTermLayerCard[];
};
