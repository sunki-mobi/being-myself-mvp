import type { BaselineReport } from "./baseline-report";
import type { BaselineShape, BaselinePartTitle } from "./baseline-shape";

/**
 * 저장된 간소화 BaselineShape를 컴포넌트가 기대하는 풀 BaselineReport로 변환.
 *
 * 간소화 shape에는 사용자별 가변 콘텐츠(headline·items·insight·keywords)만 들어가고,
 * 고정 카피(preface·examples·closing·intro·partTitleEn·question)는 여기 템플릿에서
 * 채움. LLM 호출 토큰 절약 + 사용자 인터뷰엔 없을 만한 항목(coachInterview)은
 * 빈 배열로 둠.
 */

const PART_TEMPLATES: Record<
  BaselinePartTitle,
  {
    partTitleEn: string;
    preface: string;
    examples: string[];
    closing: string;
    question: string;
  }
> = {
  "가치 있는 것": {
    partTitleEn: "I Feel Valuable About It",
    preface:
      "내게 '가치 있는 것'은, 나에게 소중한 것, 내가 추구하는 모습 그리고 나의 가치관 같은 것을 말합니다.",
    examples: [
      "재미있게 사는 것",
      "내면을 단단하게 하는 것",
      "늘 새로운 경험을 즐기는 것",
      "다른 사람에게 인정받는 것",
      "일을 하면서 의미를 발견하는 것",
    ],
    closing:
      "좋아하고 잘하는 것은 나를 만족스럽게 할 수 있지만, 가치와 의미가 없다면 주변 환경에 의해 쉽게 변하고 무너지며 지속 가능하지 않게 됩니다. 가장 먼저, 내게 가치 있는 것에 집중해 보세요.",
    question: "나는 이렇게 살고 싶다 하는 모습이 있나요?",
  },
  "좋아하는 것": {
    partTitleEn: "I Love It",
    preface:
      "좋아하는 것은, 인생에서 가장 큰 기쁨을 주고 성취감을 느끼게 하는 일이나 경험을 말합니다.",
    examples: [
      "친구의 고민 들어주기",
      "아침에 일어나 운동하기",
      "숨은 맛집을 찾아 방문하기",
      "새로운 사람들과 이야기하기",
      "좋아하는 스포츠 선수 응원하기",
    ],
    closing:
      "내가 잘하는 것인지, 세상이 필요로 하는 것인지, 대가를 받을 수 있는 것인지에 대한 고민들은 지우고 오로지 내가 무엇을 좋아하는지에만 집중해 보세요.",
    question: "내가 정말 좋아하는 것은 무엇인가요?",
  },
  "잘하는 것": {
    partTitleEn: "I Am Great at It",
    preface:
      "우리가 집중해 볼 '잘하는 것'은, 내가 배우고 노력해서 얻은 스킬이 아니라 남들보다 자연스럽게 잘하는 나의 강점을 말합니다.",
    examples: [
      "공감하는 것",
      "대중 앞에서 연설하는 것",
      "무엇인가를 만들어내는 것",
      "체계적으로 분석하는 것",
      "주의 깊게 관찰하는 것",
    ],
    closing:
      "내가 어릴 때부터 타고난 재능일 수도 있고, 의도하지 않았는데 어느 순간 꽃을 피운 능력일 수도 있습니다. 크고 작은 성공 경험을 떠올리며 내가 무엇을 잘하는지에만 집중해 보세요.",
    question: "내가 잘하는 것은 무엇인가요?",
  },
};

const DEFAULT_INTRO =
  "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다. 셀프인터뷰를 통해, 내가 답한 내용을 세부적으로 살펴보며 다시 한 번 깊게 고민하고 질문해보는 시간이 되시길 바랍니다.";

export function shapeToFullReport(
  shape: BaselineShape,
  meta: { userName: string },
): BaselineReport {
  return {
    userName: meta.userName,
    headline: shape.headline,
    intro: DEFAULT_INTRO,
    parts: shape.parts.map((p) => {
      const tpl = PART_TEMPLATES[p.partTitle];
      return {
        partTitle: p.partTitle,
        partTitleEn: tpl.partTitleEn,
        preface: tpl.preface,
        examples: tpl.examples,
        closing: tpl.closing,
        questions: [
          {
            question: tpl.question,
            items: p.items,
            insight: {
              text: p.insight,
              keywords: p.keywords,
            },
            coachInterview: [],
          },
        ],
      };
    }),
  };
}
