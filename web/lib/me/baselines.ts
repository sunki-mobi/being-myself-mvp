/**
 * Baseline 셀프인터뷰 보고서 registry.
 *
 * `/me` (방선기 본인 시연) + `/demo` (페르소나 3종 게스트 시연) 모두 같은
 * BaselineReport 데이터 구조 사용. 페르소나는 단지 "이미 채워진 baseline 보고서"
 * 의 다른 인스턴스. server route는 baselineId로 컨텍스트 조회, client는 import로
 * connection 카드 본문 표시.
 *
 * 페르소나 baseline 콘텐츠는 `[TODO]` 슬롯 — 박람회 직전에 사용자가 채움. 흐름은
 * 비어 있어도 동작.
 */
import {
  BASELINE_REPORT as SKPAN_BASELINE,
  type BaselineReport,
} from "./baseline-report";

export type BaselineId = "skpan" | "minister" | "worker" | "student";

/**
 * 페르소나 baseline 슬롯 helper — 모든 Part·항목·인사이트가 [TODO]로 채워진
 * 빈 보고서를 만든다. 사용자가 박람회 직전에 본문만 갈아끼우면 됨.
 */
function blankPersonaBaseline(args: {
  userName: string;
  ctx: string; // "사역자" | "직장인" | "학생"
  headline: string;
  intro: string;
}): BaselineReport {
  return {
    userName: args.userName,
    headline: args.headline,
    intro: args.intro,
    parts: [
      {
        partTitle: "가치 있는 것",
        partTitleEn: "I Feel Valuable About It",
        preface:
          "내게 '가치 있는 것'은, 나에게 소중한 것, 내가 추구하는 모습 그리고 나의 가치관 같은 것을 말합니다.",
        examples: [
          `[${args.ctx} 가치 있는 것 예시1 — Day 3]`,
          `[${args.ctx} 가치 있는 것 예시2 — Day 3]`,
          `[${args.ctx} 가치 있는 것 예시3 — Day 3]`,
        ],
        closing: `[${args.ctx} 가치 있는 것 격려문 — Day 3]`,
        questions: [
          {
            question: "나는 이렇게 살고 싶다 하는 모습이 있나요?",
            meta: "내 인생에 있어 중요한 가치를 알고 있나요? — 알고 있어요",
            items: [
              {
                title: `[${args.ctx} 가치 있는 것 항목 1 제목 — Day 3]`,
                description: [`[${args.ctx} 가치 있는 것 항목 1 설명 — Day 3]`],
              },
              {
                title: `[${args.ctx} 가치 있는 것 항목 2 제목 — Day 3]`,
                description: [`[${args.ctx} 가치 있는 것 항목 2 설명 — Day 3]`],
              },
            ],
            insight: {
              text: `[${args.ctx} 가치 있는 것 인사이트 — Day 3]`,
              keywords: [`[${args.ctx} 가치 있는 것 키워드들 — Day 3]`],
            },
            coachInterview: [
              `[${args.ctx} 가치 있는 것 코치인터뷰 발췌 — Day 3]`,
            ],
          },
        ],
      },
      {
        partTitle: "좋아하는 것",
        partTitleEn: "I Love It",
        preface:
          "좋아하는 것은, 인생에서 가장 큰 기쁨을 주고 성취감을 느끼게 하는 일이나 경험을 말합니다.",
        examples: [
          `[${args.ctx} 좋아하는 것 예시1 — Day 3]`,
          `[${args.ctx} 좋아하는 것 예시2 — Day 3]`,
          `[${args.ctx} 좋아하는 것 예시3 — Day 3]`,
        ],
        closing: `[${args.ctx} 좋아하는 것 격려문 — Day 3]`,
        questions: [
          {
            question: "내가 정말 좋아하는 것은 무엇인가요?",
            meta: "내가 정말 좋아하는 것이 무엇인지 알고 있나요? — 알고 있어요",
            items: [
              {
                title: `[${args.ctx} 좋아하는 것 항목 1 제목 — Day 3]`,
                description: [`[${args.ctx} 좋아하는 것 항목 1 설명 — Day 3]`],
              },
              {
                title: `[${args.ctx} 좋아하는 것 항목 2 제목 — Day 3]`,
                description: [`[${args.ctx} 좋아하는 것 항목 2 설명 — Day 3]`],
              },
            ],
            insight: {
              text: `[${args.ctx} 좋아하는 것 인사이트 — Day 3]`,
              keywords: [`[${args.ctx} 좋아하는 것 키워드들 — Day 3]`],
            },
            coachInterview: [
              `[${args.ctx} 좋아하는 것 코치인터뷰 발췌 — Day 3]`,
            ],
          },
        ],
      },
      {
        partTitle: "잘하는 것",
        partTitleEn: "I Am Great at It",
        preface:
          "우리가 집중해 볼 '잘하는 것'은, 내가 배우고 노력해서 얻은 스킬이 아니라 남들보다 자연스럽게 잘하는 나의 강점을 말합니다.",
        examples: [
          `[${args.ctx} 잘하는 것 예시1 — Day 3]`,
          `[${args.ctx} 잘하는 것 예시2 — Day 3]`,
          `[${args.ctx} 잘하는 것 예시3 — Day 3]`,
        ],
        closing: `[${args.ctx} 잘하는 것 격려문 — Day 3]`,
        questions: [
          {
            question: "내가 잘하는 것은 무엇인가요?",
            meta: "내가 잘하는 것이 무엇인지 알고 있나요? — 알고 있어요",
            items: [
              {
                title: `[${args.ctx} 잘하는 것 항목 1 제목 — Day 3]`,
                description: [`[${args.ctx} 잘하는 것 항목 1 설명 — Day 3]`],
              },
              {
                title: `[${args.ctx} 잘하는 것 항목 2 제목 — Day 3]`,
                description: [`[${args.ctx} 잘하는 것 항목 2 설명 — Day 3]`],
              },
            ],
            insight: {
              text: `[${args.ctx} 잘하는 것 인사이트 — Day 3]`,
              keywords: [`[${args.ctx} 잘하는 것 키워드들 — Day 3]`],
            },
            coachInterview: [
              `[${args.ctx} 잘하는 것 코치인터뷰 발췌 — Day 3]`,
            ],
          },
        ],
      },
    ],
  };
}

const COMMON_INTRO =
  "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.";

export const BASELINES: Record<BaselineId, BaselineReport> = {
  skpan: SKPAN_BASELINE,
  minister: blankPersonaBaseline({
    userName: "최병호",
    ctx: "사역자",
    headline: "[사역자 헤드라인 — Day 3]",
    intro: COMMON_INTRO,
  }),
  worker: blankPersonaBaseline({
    userName: "정다은",
    ctx: "직장인",
    headline: "[직장인 헤드라인 — Day 3]",
    intro: COMMON_INTRO,
  }),
  student: blankPersonaBaseline({
    userName: "이준혁",
    ctx: "학생",
    headline: "[학생 헤드라인 — Day 3]",
    intro: COMMON_INTRO,
  }),
};

export function getBaseline(id: BaselineId): BaselineReport {
  return BASELINES[id];
}

/**
 * baseline ID 유효성 체크 (server route에서 user input 검증용).
 */
export function isBaselineId(value: unknown): value is BaselineId {
  return (
    typeof value === "string" &&
    (value === "skpan" ||
      value === "minister" ||
      value === "worker" ||
      value === "student")
  );
}
