"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "bm:conversation:v1";

export type ConversationRole = "ai-question" | "user-answer" | "ai-reaction";

export type ConversationMessage = {
  role: ConversationRole;
  text: string;
  /** 사용자 답변일 때만 있음 — 어떤 질문에 대한 답인지 표시 */
  questionIndex?: number;
};

export type ConversationState = {
  /** 가짜 로그인된 사용자 이름 (Phase B에서는 Google 프로필에서 가져옴) */
  userName: string | null;
  messages: ConversationMessage[];
  /** 다음에 던질 질문의 index. QUESTION_POOL.length면 완료 */
  nextQuestionIndex: number;
};

/**
 * Phase B 자유 텍스트 대화의 질문 풀.
 * 기획안 8.1의 질문 층위 모델 (현상 → 본질 → 가치 → 존재)을 따름.
 *
 * 박람회 후 Claude API 통합 시 이 풀은 폐기되고, 사용자의
 * 셀프인터뷰 데이터 + 이전 답변을 컨텍스트로 동적 생성.
 */
export const QUESTION_POOL: string[] = [
  "오늘 가장 마음에 남은 한 순간이 있다면 무엇이었나요?",
  "그 순간에 당신은 어떤 사람이고 싶었나요?",
  "그 모습이 당신이 진짜 좋아하는 자신과 얼마나 가까웠나요?",
];

/**
 * 답변 직후의 AI 짧은 리액션 풀. 답변 길이/내용에 따라 가장 어울리는 걸 선택
 * (Phase B에서는 Claude로 대체).
 */
const REACTION_POOL: string[] = [
  "그 표현이 참 정확하네요.",
  "그렇게 말씀해 주시는군요.",
  "그 한 마디 안에 많은 게 담겨 있어요.",
  "흥미로운 시각이에요.",
  "충분해요. 그 한 줄로도 잘 전해집니다.",
];

function pickReaction(answerText: string): string {
  // 짧은 답변은 짧은 답변에 맞는 리액션
  const trimmed = answerText.trim();
  if (trimmed.length < 8) return "충분해요. 그 한 마디 안에 많은 게 담겨 있어요.";
  // 그 외에는 인덱스 기반 rotate
  const idx = trimmed.length % REACTION_POOL.length;
  return REACTION_POOL[idx];
}

const initial: ConversationState = {
  userName: null,
  messages: [],
  nextQuestionIndex: 0,
};

function loadFromStorage(): ConversationState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    return {
      userName: parsed.userName ?? null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      nextQuestionIndex:
        typeof parsed.nextQuestionIndex === "number"
          ? parsed.nextQuestionIndex
          : 0,
    };
  } catch {
    return initial;
  }
}

function saveToStorage(state: ConversationState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  /** mock login — 사용자 이름 설정. Phase B에서는 Google profile로 대체. */
  const login = useCallback((name: string) => {
    setState((prev) => {
      const next: ConversationState = { ...prev, userName: name };
      saveToStorage(next);
      return next;
    });
  }, []);

  /** 첫 진입 시 첫 질문을 messages에 추가 */
  const startConversation = useCallback(() => {
    setState((prev) => {
      // 이미 시작된 대화면 그대로 두기
      if (prev.messages.length > 0) return prev;
      const first = QUESTION_POOL[0];
      const next: ConversationState = {
        ...prev,
        messages: [{ role: "ai-question", text: first }],
        nextQuestionIndex: 1,
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  /** 사용자가 답변 제출 → 답변 + AI 리액션 + 다음 질문 (있으면) 추가 */
  const submitAnswer = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setState((prev) => {
      const currentQuestionIdx = prev.nextQuestionIndex - 1;
      const newMessages: ConversationMessage[] = [
        ...prev.messages,
        { role: "user-answer", text: trimmed, questionIndex: currentQuestionIdx },
        { role: "ai-reaction", text: pickReaction(trimmed) },
      ];

      let nextIdx = prev.nextQuestionIndex;
      if (nextIdx < QUESTION_POOL.length) {
        newMessages.push({
          role: "ai-question",
          text: QUESTION_POOL[nextIdx],
        });
        nextIdx += 1;
      }

      const next: ConversationState = {
        ...prev,
        messages: newMessages,
        nextQuestionIndex: nextIdx,
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setState(initial);
  }, []);

  /** 대화가 모두 끝났는지 (마지막 질문에 답변까지 완료) */
  const isComplete =
    state.nextQuestionIndex >= QUESTION_POOL.length &&
    state.messages.filter((m) => m.role === "user-answer").length >=
      QUESTION_POOL.length;

  return {
    state,
    hydrated,
    login,
    startConversation,
    submitAnswer,
    reset,
    isComplete,
  };
}
