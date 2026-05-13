/**
 * 셀프인터뷰 질문 시퀀스 — 3 Q-block × (객관식 → 음성).
 *
 * 일반인 default 톤. Audience pack(예: 기독교 리더용)을 만들려면 이 파일의
 * 패러렐 버전을 작성하고 progress·합성 모듈에서 선택할 수 있게 분기.
 *
 * 각 Q-block:
 *  - choice: 객관식 (알고 있어요 / 잘 모르겠어요)
 *  - voice.knows: "알고 있어요" 선택 시 보이는 음성 질문
 *  - voice.unsure: "잘 모르겠어요" 선택 시 보이는 음성 질문
 *
 * 6-step 진행:
 *   step 0: q1.choice
 *   step 1: q1.voice
 *   step 2: q2.choice
 *   step 3: q2.voice
 *   step 4: q3.choice
 *   step 5: q3.voice
 *   step 6: 완료 (합성 진입)
 */

export type ChoiceBranch = "knows" | "unsure";

export type QuestionBlock = {
  /** 'q1' | 'q2' | 'q3' */
  id: "q1" | "q2" | "q3";
  /** Part 라벨 (보고서 상의 매핑) */
  part: "좋아하는 것" | "잘하는 것" | "가치 있는 것";
  choice: {
    text: string;
    options: { value: ChoiceBranch; label: string }[];
  };
  voice: Record<
    ChoiceBranch,
    {
      text: string;
      helper?: string;
    }
  >;
};

export const BASELINE_QUESTIONS: QuestionBlock[] = [
  {
    id: "q1",
    part: "좋아하는 것",
    choice: {
      text: "내가 정말 좋아하는 것이 무엇인지 알고 있나요?",
      options: [
        { value: "knows", label: "알고 있어요" },
        { value: "unsure", label: "잘 모르겠어요" },
      ],
    },
    voice: {
      knows: {
        text: "내가 정말 좋아하는 것은 무엇인가요?",
        helper: "떠오르는 것들을 자유롭게 말해보세요.",
      },
      unsure: {
        text: "그럼, 내가 즐겁고 설레는 것은 무엇인가요?",
        helper: "최근에 마음이 향했던 순간들을 떠올려보세요.",
      },
    },
  },
  {
    id: "q2",
    part: "잘하는 것",
    choice: {
      text: "내가 잘하는 것이 무엇인지 알고 있나요?",
      options: [
        { value: "knows", label: "알고 있어요" },
        { value: "unsure", label: "잘 모르겠어요" },
      ],
    },
    voice: {
      knows: {
        text: "내가 잘하는 것은 무엇인가요?",
        helper: "자연스럽게 잘되는 일을 떠올려보세요.",
      },
      unsure: {
        text: "그럼, 주변 사람들이 나에게 잘한다고 칭찬했던 것은 무엇인가요?",
        helper: "타인의 시선에서 들어왔던 말이 단서가 돼요.",
      },
    },
  },
  {
    id: "q3",
    part: "가치 있는 것",
    choice: {
      text: "내 인생에 있어 중요한 가치를 알고 있나요?",
      options: [
        { value: "knows", label: "알고 있어요" },
        { value: "unsure", label: "잘 모르겠어요" },
      ],
    },
    voice: {
      knows: {
        text: "'나는 이렇게 살고 싶다' 하는 모습이 있나요?",
        helper: "5년 뒤·10년 뒤를 떠올려도 좋아요.",
      },
      unsure: {
        text: "그럼, '나는 이렇게 살고 싶다' 하는 모습이 있나요?",
        helper: "조각이라도 좋아요. 떠오르는 모습을 그대로.",
      },
    },
  },
];

export const TOTAL_STEPS = BASELINE_QUESTIONS.length * 2; // 6

/** step index → (block index, sub-step: 'choice' | 'voice') */
export function stepToLocation(step: number): {
  blockIndex: number;
  sub: "choice" | "voice";
} | null {
  if (step < 0 || step >= TOTAL_STEPS) return null;
  return {
    blockIndex: Math.floor(step / 2),
    sub: step % 2 === 0 ? "choice" : "voice",
  };
}

export type InterviewAnswers = Partial<
  Record<
    "q1" | "q2" | "q3",
    {
      choice: ChoiceBranch;
      voice: string;
    }
  >
>;
