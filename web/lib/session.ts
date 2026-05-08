"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  SessionState,
  PersonaId,
  ChoiceKey,
  StepIndex,
  Direction,
} from "./types";

const STORAGE_KEY = "bm:session:v1";

const initial: SessionState = {
  personaId: null,
  answers: { q1: null, q2: null },
};

function loadFromStorage(): SessionState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      personaId: parsed.personaId ?? null,
      answers: {
        q1: parsed.answers?.q1 ?? null,
        q2: parsed.answers?.q2 ?? null,
      },
    };
  } catch {
    return initial;
  }
}

function saveToStorage(state: SessionState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * 박람회 게스트 세션 상태.
 * - sessionStorage에 저장 → 탭 닫히면 자동 소거
 * - 액션 핸들러에서 동기적으로 storage 쓰기 → page navigation race 차단
 * - hydrated가 false인 동안에는 server/SSR과 동기화 차이로 잘못된 redirect 방지
 */
export function useSession() {
  const [state, setState] = useState<SessionState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  const setPersona = useCallback((id: PersonaId) => {
    setState((prev) => {
      const next: SessionState = { ...prev, personaId: id };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setAnswer = useCallback((step: StepIndex, choice: ChoiceKey) => {
    setState((prev) => {
      const nextAnswers = { ...prev.answers };
      if (step === 0) nextAnswers.q1 = choice;
      if (step === 1) nextAnswers.q2 = choice;
      const next: SessionState = { ...prev, answers: nextAnswers };
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

  return { state, hydrated, setPersona, setAnswer, reset };
}

/**
 * 두 답변에서 보고서 방향 계산 (기획안 7.3).
 *   - 둘 다 1 → 방향1
 *   - 둘 다 2 → 방향2
 *   - 1+2 (혼합) → q1의 방향을 따름 (첫 인상 우선)
 */
export function deriveDirection(
  q1Direction: Direction,
  q2Direction: Direction
): Direction {
  if (q1Direction === q2Direction) return q1Direction;
  return q1Direction;
}
