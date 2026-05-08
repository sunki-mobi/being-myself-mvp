import type { Persona, PersonaId } from "./types";

/**
 * 박람회 데모용 페르소나 3종.
 * 콘텐츠 슬롯({TODO}, [TODO])은 박람회 전 Day 3에 사용자가 직접 작성.
 * 구조는 그대로 두고 텍스트만 채우면 됨.
 *
 * 방향 매핑:
 *   - 선택 A 또는 B   → direction1
 *   - 선택 C          → direction2
 * (기획안 7.3 그대로)
 *
 * Headline 슬롯:
 *   {choice1} → 사용자가 q1에서 고른 선택지 label
 *   {choice2} → 사용자가 q2에서 고른 선택지 label
 */

const minister: Persona = {
  id: "minister",
  name: "최병호",
  age: 45,
  role: "담임목사",
  tagline: "말씀 중심, 공동체 지향, 장기적 시각",
  cardSubtitle: "사역자 — 담임목사·부교역자",
  welcome:
    "최병호 목사님, 반갑습니다. 설교 준비부터 심방까지 바쁜 사역의 시간 중에, 오늘은 잠깐 나 자신에게 집중하는 시간을 가져보시겠어요?",
  questions: [
    {
      text: "[Q1: 사역자 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
    {
      text: "[Q2: 사역자 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
  ],
  reactions: {
    A: "그 표현, 인상 깊네요.",
    B: "그렇게 말씀해주시는군요.",
    C: "흥미로운 시각이에요.",
  },
  reports: {
    direction1: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[사역자 방향1 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[사역자 방향1 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[사역자 방향1 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[사역자 방향1 인사이트 — Day 3 작성]",
      keywords: ["#말씀", "#공동체", "#성장"],
    },
    direction2: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[사역자 방향2 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[사역자 방향2 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[사역자 방향2 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[사역자 방향2 인사이트 — Day 3 작성]",
      keywords: ["#말씀", "#회복", "#기도"],
    },
  },
};

const worker: Persona = {
  id: "worker",
  name: "정다은",
  age: 29,
  role: "직장인",
  tagline: "일과 신앙의 통합, 개인 역량 중심",
  cardSubtitle: "직장인 — 신앙을 가진 직장인",
  welcome:
    "다은님, 반갑습니다. 일과 신앙 사이에서 오늘도 분주하셨죠? 오늘은 잠깐 나 자신에게 집중하는 시간을 가져보시겠어요?",
  questions: [
    {
      text: "[Q1: 직장인 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
    {
      text: "[Q2: 직장인 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
  ],
  reactions: {
    A: "그 부분이 마음에 닿네요.",
    B: "흥미로운 표현이에요.",
    C: "그렇게도 보실 수 있겠네요.",
  },
  reports: {
    direction1: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[직장인 방향1 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[직장인 방향1 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[직장인 방향1 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[직장인 방향1 인사이트 — Day 3 작성]",
      keywords: ["#성장", "#균형", "#소명"],
    },
    direction2: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[직장인 방향2 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[직장인 방향2 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[직장인 방향2 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[직장인 방향2 인사이트 — Day 3 작성]",
      keywords: ["#회복", "#리더십", "#동행"],
    },
  },
};

const student: Persona = {
  id: "student",
  name: "이준혁",
  age: 15,
  role: "중학생",
  tagline: "방향 탐색 중, 관계와 재미 중심",
  cardSubtitle: "중고등학생 — 청소년",
  welcome:
    "준혁아, 반갑다. 학교에서 친구들이랑 보내는 시간 사이에, 오늘은 잠깐 너 자신에게 집중하는 시간을 가져볼래?",
  questions: [
    {
      text: "[Q1: 학생 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
    {
      text: "[Q2: 학생 페르소나용 질문 — Day 3 작성]",
      choices: [
        { key: "A", label: "[A 선택지 — 방향1]", direction: 1 },
        { key: "B", label: "[B 선택지 — 방향1]", direction: 1 },
        { key: "C", label: "[C 선택지 — 방향2]", direction: 2 },
      ],
    },
  ],
  reactions: {
    A: "오, 그 말 괜찮네.",
    B: "그렇게 생각하는구나.",
    C: "흥미로운 시각이야.",
  },
  reports: {
    direction1: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[학생 방향1 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[학생 방향1 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[학생 방향1 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[학생 방향1 인사이트 — Day 3 작성]",
      keywords: ["#친구", "#재미", "#발견"],
    },
    direction2: {
      headline:
        "내가 진정 하고 싶은 일은 '{choice1}'와 '{choice2}'가 만나는 자리입니다.",
      intro:
        "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다.",
      parts: [
        {
          heading: "Part 1. 좋아하는 것 I Love It",
          body: "[학생 방향2 Part1 본문 — Day 3 작성]",
        },
        {
          heading: "Part 2. 잘하는 것 I Am Great at It",
          body: "[학생 방향2 Part2 본문 — Day 3 작성]",
        },
        {
          heading: "Part 3. 가치있는 것 I Feel Valuable About It",
          body: "[학생 방향2 Part3 본문 — Day 3 작성]",
        },
      ],
      insight: "[학생 방향2 인사이트 — Day 3 작성]",
      keywords: ["#도전", "#관계", "#가능성"],
    },
  },
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
