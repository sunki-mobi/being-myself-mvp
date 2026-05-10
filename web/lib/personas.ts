import type { Persona, PersonaId } from "./types";

/**
 * 박람회 데모용 페르소나 3종.
 *
 * /demo 트랙 흐름 (2026-05-10 토큰 절감):
 *   - 페르소나 카드 → welcome → conversation
 *   - 두 질문은 LLM 호출 X — 페르소나마다 hardcoded
 *   - reaction도 LLM 호출 X — 카드 사이 짧은 transition만
 *   - LLM은 보고서에서만 (answer-card 정리 + digest 4단)
 *
 * baseline 보고서 본문은 `web/lib/me/baselines.ts`의 BASELINES에 있음. 콘텐츠
 * `[TODO]` 슬롯은 박람회 직전 사용자가 채움.
 */

const minister: Persona = {
  id: "minister",
  baselineId: "minister",
  name: "최병호",
  age: 45,
  role: "담임목사",
  tagline: "말씀 중심, 공동체 지향, 장기적 시각",
  cardSubtitle: "사역자 — 담임목사·부교역자",
  welcome:
    "최병호 목사님, 반갑습니다. 설교 준비부터 심방까지 바쁜 사역의 시간 중에, 오늘은 잠깐 나 자신에게 집중하는 시간을 가져보시겠어요?",
  // Q1·Q2: 검증 질문 라이브러리 v1 — design doc skpan-master-design-20260510-162758.md
  questions: [
    {
      text: "오늘 하루 중에서, 시간 가는 줄 모르고 빠져들었던 한 순간이 있나요?",
      suggestedAnswers: [
        "주일 설교 본문을 묵상하다가 한 구절에 깊이 들어갔을 때",
      ],
    },
    {
      text: "주변 사람이 '이건 목사님답다' 라고 했던 순간이 있다면 어떤 순간이었나요?",
      suggestedAnswers: [
        "심방 가서 길게 들어드렸는데 '덕분에 마음이 풀렸다'는 말을 들었을 때",
      ],
    },
  ],
};

const worker: Persona = {
  id: "worker",
  baselineId: "worker",
  name: "정다은",
  age: 29,
  role: "직장인",
  tagline: "일과 신앙의 통합, 개인 역량 중심",
  cardSubtitle: "직장인 — 신앙을 가진 직장인",
  welcome:
    "다은님, 반갑습니다. 일과 신앙 사이에서 오늘도 분주하셨죠? 오늘은 잠깐 나 자신에게 집중하는 시간을 가져보시겠어요?",
  // Q1·Q2: 검증 질문 라이브러리 v1 — design doc skpan-master-design-20260510-162758.md
  questions: [
    {
      text: "오늘 하루 중에서, 시간 가는 줄 모르고 빠져들었던 한 순간이 있나요?",
      suggestedAnswers: [
        "퇴근 후 좋아하는 일을 하다 보니 시간이 훌쩍 지났을 때",
      ],
    },
    {
      text: "주변 사람이 '이건 다은님이 해줘야 해' 라고 했던 순간이 있다면 어떤 순간이었나요?",
      suggestedAnswers: [
        "회의가 막혔을 때 '다은님은 어떻게 보세요?'라고 물어왔던 순간",
      ],
    },
  ],
};

const student: Persona = {
  id: "student",
  baselineId: "student",
  name: "이준혁",
  age: 15,
  role: "중학생",
  tagline: "방향 탐색 중, 관계와 재미 중심",
  cardSubtitle: "중고등학생 — 청소년",
  welcome:
    "준혁님, 반갑습니다. 학교에서 친구들과 보내는 시간 사이에, 오늘은 잠깐 나 자신에게 집중하는 시간을 가져보시겠어요?",
  // Q1·Q2: 검증 질문 라이브러리 v1 — design doc skpan-master-design-20260510-162758.md
  questions: [
    {
      text: "오늘 하루 중에서, 시간 가는 줄 모르고 빠져들었던 한 순간이 있나요?",
      suggestedAnswers: [
        "쉬는 시간에 친구들과 게임하다가 시간 가는 줄 몰랐을 때",
      ],
    },
    {
      text: "친구나 선생님이 '이건 너답다' 또는 '너랑 있으면 ~ 해' 라고 했던 순간이 있다면 어떤 순간이었나요?",
      suggestedAnswers: [
        "친구가 '너랑 이야기하면 마음이 편해진다'고 말해준 순간",
      ],
    },
  ],
};

export const PERSONAS: Record<PersonaId, Persona> = {
  minister,
  worker,
  student,
};

export const PERSONA_ORDER: PersonaId[] = ["minister", "worker", "student"];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id];
}
