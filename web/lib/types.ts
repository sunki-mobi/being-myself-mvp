/**
 * /demo 트랙 타입 — 페르소나 메타데이터만.
 *
 * 이전 버전의 객관식 흐름(Question·Choice·Direction·Reactions)은 폐지됨.
 * 페르소나 baseline 보고서는 `web/lib/me/baselines.ts`에서 BaselineId로 lookup.
 */
import type { BaselineId } from "./me/baselines";

export type PersonaId = "minister" | "worker" | "student";

/**
 * 박람회 게스트가 풀 두 질문 — LLM 호출 없이 baseline에 미리 작성.
 * suggestedAnswers는 빠른 답변 칩 1~2개 (빈 배열이면 자유 답변만).
 */
export type HardcodedQuestion = {
  text: string;
  suggestedAnswers: string[];
};

export type Persona = {
  id: PersonaId;
  /** baseline 보고서 ID — `web/lib/me/baselines.ts`의 BASELINES에서 조회 */
  baselineId: BaselineId;
  name: string;
  age: number;
  role: string;
  tagline: string;
  /** 짧은 한 줄 소개 — 카드용 */
  cardSubtitle: string;
  welcome: string;
  /**
   * 두 질문 hardcoded — Gemini chat API 호출 0회. baseline의 결을 미리 반영해서
   * 사용자가 Day 3에 작성. answer-card·digest는 여전히 LLM 처리.
   */
  questions: [HardcodedQuestion, HardcodedQuestion];
};
