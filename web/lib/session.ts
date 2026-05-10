"use client";

import { useEffect, useState, useCallback } from "react";
import type { PersonaId } from "./types";

const STORAGE_KEY = "bm:session:v2";

type SessionState = {
  personaId: PersonaId | null;
};

const initial: SessionState = {
  personaId: null,
};

function loadFromStorage(): SessionState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return { personaId: parsed.personaId ?? null };
  } catch {
    return initial;
  }
}

function saveToStorage(state: SessionState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * 박람회 게스트 세션 — 선택한 페르소나만 저장.
 *
 * 답변·대화 상태는 `useConversation({ namespace: "demo", baselineId })`이 담당.
 * 페르소나 선택 시 이전 conversation도 reset되어야 함 (게스트 시연마다 깨끗).
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

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setState(initial);
  }, []);

  return { state, hydrated, setPersona, reset };
}
