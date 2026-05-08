export type PersonaId = "minister" | "worker" | "student";
export type ChoiceKey = "A" | "B" | "C";
export type Direction = 1 | 2;
export type StepIndex = 0 | 1;

export type Choice = {
  key: ChoiceKey;
  label: string;
  direction: Direction;
};

export type Question = {
  text: string;
  choices: [Choice, Choice, Choice];
};

export type ReportPart = {
  heading: string;
  body: string;
};

export type Report = {
  /** "내가 진정 하고 싶은 일은 {choice1}와(과) {choice2}가 만나는 자리입니다." */
  headline: string;
  intro: string;
  parts: [ReportPart, ReportPart, ReportPart]; // Part 1 / 2 / 3
  insight: string;
  keywords: string[];
};

export type Persona = {
  id: PersonaId;
  name: string;
  age: number;
  role: string;
  tagline: string;
  /** 짧은 한 줄 소개 — 카드용 */
  cardSubtitle: string;
  welcome: string;
  questions: [Question, Question];
  /** 선택 직후 짧은 리액션 — choice key별 */
  reactions: Record<ChoiceKey, string>;
  reports: {
    direction1: Report;
    direction2: Report;
  };
};

export type SessionAnswers = {
  q1: ChoiceKey | null;
  q2: ChoiceKey | null;
};

export type SessionState = {
  personaId: PersonaId | null;
  answers: SessionAnswers;
};
