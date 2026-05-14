/**
 * 셀프인터뷰 prepare 4-step 안내 데이터.
 *
 * 시간·공간·목소리·기록 4가지 마음가짐을 잡아주는 화면.
 * /demo/prepare(게스트 시연 — deprecated, 1번 단계에서 제거됨)와
 * /me/baseline/prepare(로그인 사용자, 셀프인터뷰 1회 전) 양쪽에서 재사용.
 */

export type StepConfig = {
  /** 제목 — 줄바꿈 단위로 분리 */
  title: string[];
  illustration: string;
  illustrationAlt: string;
  /** bold 강조 1줄 + 본문 N줄 */
  description: { bold: string; rest: string[] };
  cta: string;
};

export const PREPARE_STEPS: StepConfig[] = [
  {
    title: ["혼자만의 ‘시간’을", "준비해주세요"],
    illustration: "/img/prepare/step-1-clock.svg",
    illustrationAlt: "회중시계 일러스트",
    description: {
      bold: "셀프인터뷰의 평균 소요시간은 약 15분이지만,",
      rest: [
        "개인에 따라 30~40분을 하기도 해요.",
        "시간에 구애받지 않고 몰입해 봐요.",
      ],
    },
    cta: "준비됐어요!",
  },
  {
    title: ["혼자만의 ‘공간’을", "준비해주세요"],
    illustration: "/img/prepare/step-2-house.svg",
    illustrationAlt: "작은 집과 나무 일러스트",
    description: {
      bold: "방해받지 않는 조용한 환경은",
      rest: [
        "나의 내면 깊은 이야기들을 꺼내는데",
        "도움이 될 거에요.",
      ],
    },
    cta: "네, 준비됐어요!",
  },
  {
    title: ["차분하고 낮은 ‘목소리’로", "떠오르는 것을 답해보세요"],
    illustration: "/img/prepare/step-3-voice.svg",
    illustrationAlt: "말풍선과 옆모습 일러스트",
    description: {
      bold: "글로 적거나 말로 답해도 괜찮아요!",
      rest: [
        "의식의 흐름대로 말하다보면",
        "내 본심에 더 가까워질거에요.",
      ],
    },
    cta: "이해했어요!",
  },
  {
    title: ["나를 발견하는 기록이", "쌓여가요"],
    illustration: "/img/prepare/step-4-review.svg",
    illustrationAlt: "보고서를 살피는 일러스트",
    description: {
      bold: "답변한 내용은 나만의 보고서로 정리돼요.",
      rest: [
        "하루하루 쌓일수록 내가 어떤 사람인지",
        "조금씩 선명해질 거에요.",
      ],
    },
    cta: "시작할게요!",
  },
];

export const TOTAL_PREPARE_STEPS = PREPARE_STEPS.length;
