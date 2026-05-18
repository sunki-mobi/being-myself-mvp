"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { BaselineId } from "./me/baselines";
import type { HardcodedQuestion } from "./types";

const STORAGE_PREFIX = "bm:conversation";

export type ConversationRole = "ai-question" | "user-answer" | "ai-reaction";

export type ConversationMessage = {
  role: ConversationRole;
  text: string;
  /** 사용자 답변일 때만 있음 — 어떤 질문 index에 대한 답인지 */
  questionIndex?: number;
  /**
   * ai-question일 때만 있음 (demo 모드에서). 게스트가 칩으로 탭하면 textarea에
   * 자동 채워지는 빠른 답변 후보 3개.
   */
  suggestedAnswers?: string[];
  /**
   * ai-question일 때만 있음 — 풀에서 선택된 question id (예: "Q017"). Q2 turn
   * 에서 chat API가 채워줌. 풀 미사용 turn(Q1·풀 소진)에는 빈 문자열/undefined.
   * qa-pair POST 시 함께 보내 DB에 누적 → 다음 호출에서 영구 중복 차단.
   */
  selectedQuestionId?: string;
  /**
   * user-answer일 때만 있음. POST /api/me/qa-pairs 응답 후 채워짐.
   * answer-card 캐시 키로 사용. /demo 트랙은 채워지지 않음 (persistTurns false).
   */
  qaPairId?: string;
};

export type ConversationState = {
  /** 가짜 로그인된 사용자 이름 (Phase B에서는 Google 프로필) */
  userName: string | null;
  /**
   * 한 세션의 conversation UUID. persistTurns가 true일 때, 첫 startConversation
   * 시 client-generated로 할당. reset 시 클리어.
   */
  conversationId: string | null;
  messages: ConversationMessage[];
  /** AI가 마무리 신호를 보냈는지 */
  isComplete: boolean;
};

export type ConversationOptions = {
  /**
   * Storage 분리용 namespace. /me 트랙 = "me", /demo 트랙 = "demo".
   * 게스트 시연이 사용자 누적 데이터를 망가뜨리지 않도록.
   */
  namespace?: "me" | "demo";
  /**
   * 페이스메이커가 인지할 baseline 보고서 ID. /api/me/chat·digest 호출 시
   * body에 함께 보냄. 미지정 시 server 기본값(skpan)으로.
   */
  baselineId?: BaselineId;
  /**
   * "demo"면 chat API가 답변 후보(suggestedAnswers)도 함께 생성. 미지정 시 "me".
   * hardcodedQuestions가 있으면 무관 (chat API 자체 호출 안 함).
   */
  mode?: "me" | "demo";
  /**
   * Hardcoded 두 질문 (페르소나 baseline 기반). 있으면 chat API 호출 0회 —
   * startConversation·submitAnswer가 즉시 다음 질문/마무리를 messages에 추가.
   * /demo 트랙 토큰 절감용.
   */
  hardcodedQuestions?: [HardcodedQuestion, HardcodedQuestion];
  /**
   * Hardcoded 모드에서 Q1 위에 보일 환영 메시지 (ai-reaction 자리).
   * 없으면 바로 Q1 카드.
   */
  hardcodedWelcome?: string;
  /**
   * 매 turn 완료 시 fire-and-forget으로 /api/me/qa-pairs에 누적 저장.
   * Phase 2 — /me 트랙(로그인 사용자)에서만 true. /demo는 항상 false.
   */
  persistTurns?: boolean;
};

const initial: ConversationState = {
  userName: null,
  conversationId: null,
  messages: [],
  isComplete: false,
};

function loadFromStorage(storageKey: string): ConversationState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    return {
      userName: parsed.userName ?? null,
      conversationId: parsed.conversationId ?? null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      isComplete: Boolean(parsed.isComplete),
    };
  } catch {
    return initial;
  }
}

/**
 * qaPairId가 들어오면 LocalStorage 상태의 해당 user-answer 메시지에 attach.
 * 답변 텍스트와 questionIndex로 동일한 답변을 식별 — reset 후 같은 텍스트로
 * 다시 답해도 새 row가 받아짐.
 */
function attachQaPairId(
  setState: Dispatch<SetStateAction<ConversationState>>,
  storageKey: string,
  questionIndex: number,
  answerText: string,
  qaPairId: string,
) {
  setState((prev) => {
    let changed = false;
    const updated = prev.messages.map((m) => {
      if (
        m.role === "user-answer" &&
        m.questionIndex === questionIndex &&
        m.text === answerText &&
        !m.qaPairId
      ) {
        changed = true;
        return { ...m, qaPairId };
      }
      return m;
    });
    if (!changed) return prev;
    const next = { ...prev, messages: updated };
    saveToStorage(storageKey, next);
    return next;
  });
}

/**
 * /api/me/qa-pairs로 fire-and-forget POST. 실패해도 UI는 그대로 흐름.
 * 성공 시 `onPersisted` 콜백으로 qaPairId 전달 — 답변 카드 캐시 키로 사용.
 */
function persistQaPair(
  body: {
    conversationId: string;
    questionIndex: number;
    questionText: string;
    reactionText: string | null;
    answerText: string;
    isLast: boolean;
    /** Q2 turn에서 풀 선택된 id. 빈 문자열이면 DB에는 null로 저장. */
    questionId?: string;
  },
  onPersisted?: (qaPairId: string) => void,
) {
  void fetch("/api/me/qa-pairs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status !== 401) {
          const detail = await res.json().catch(() => ({}));
          console.error("[qa-pair persist]", res.status, detail);
        }
        return;
      }
      const data = await res.json().catch(() => null);
      const qaPairId = data?.qaPairId;
      if (typeof qaPairId === "string" && onPersisted) {
        onPersisted(qaPairId);
      }
    })
    .catch((err) => console.error("[qa-pair persist]", err));
}

function saveToStorage(storageKey: string, state: ConversationState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey, JSON.stringify(state));
}

type ChatTurn = {
  reaction: string;
  question: string;
  isComplete: boolean;
  suggestedAnswers: string[];
  /** Q2 turn에서 풀 선택된 id. 풀 외 turn은 빈 문자열. */
  selectedQuestionId?: string;
};

async function callPacemaker(
  userName: string,
  history: ConversationMessage[],
  baselineId: BaselineId | undefined,
  mode: "me" | "demo" | undefined,
): Promise<ChatTurn> {
  const response = await fetch("/api/me/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName,
      history: history.map((m) => ({ role: m.role, text: m.text })),
      ...(baselineId ? { baselineId } : {}),
      ...(mode ? { mode } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.error ?? `요청 실패 (${response.status})`);
  }
  return response.json();
}

export function useConversation(options: ConversationOptions = {}) {
  const namespace = options.namespace ?? "me";
  const baselineId = options.baselineId;
  const mode = options.mode;
  const hardcodedQuestions = options.hardcodedQuestions;
  const hardcodedWelcome = options.hardcodedWelcome;
  const persistTurns = options.persistTurns ?? false;

  const storageKey = useMemo(() => `${STORAGE_PREFIX}:${namespace}:v3`, [namespace]);

  const [state, setState] = useState<ConversationState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(loadFromStorage(storageKey));
    setHydrated(true);
  }, [storageKey]);

  const login = useCallback(
    (name: string) => {
      setState((prev) => {
        const next: ConversationState = { ...prev, userName: name };
        saveToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  /** 첫 진입 시 페이스메이커에게 환영 + 첫 질문을 받아옴. */
  const startConversation = useCallback(async () => {
    if (state.messages.length > 0 || !state.userName) return;
    const userName = state.userName;

    setError(null);

    // persistTurns 모드면 conversationId 발급 (없을 때만)
    const ensuredConversationId =
      persistTurns && !state.conversationId
        ? (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : null)
        : state.conversationId;

    // Hardcoded 모드 — LLM 호출 없이 즉시 첫 질문 추가
    if (hardcodedQuestions) {
      setState((prev) => {
        const newMessages: ConversationMessage[] = [];
        if (hardcodedWelcome) {
          newMessages.push({ role: "ai-reaction", text: hardcodedWelcome });
        }
        newMessages.push({
          role: "ai-question",
          text: hardcodedQuestions[0].text,
          suggestedAnswers: hardcodedQuestions[0].suggestedAnswers,
        });
        const next: ConversationState = {
          ...prev,
          conversationId: ensuredConversationId,
          messages: [...prev.messages, ...newMessages],
          isComplete: false,
        };
        saveToStorage(storageKey, next);
        return next;
      });
      return;
    }

    setIsThinking(true);
    try {
      const turn = await callPacemaker(userName, [], baselineId, mode);
      setState((prev) => {
        const newMessages: ConversationMessage[] = [];
        if (turn.reaction.trim()) {
          newMessages.push({ role: "ai-reaction", text: turn.reaction });
        }
        newMessages.push({
          role: "ai-question",
          text: turn.question,
          suggestedAnswers: turn.suggestedAnswers,
          selectedQuestionId: turn.selectedQuestionId ?? "",
        });
        const next: ConversationState = {
          ...prev,
          conversationId: ensuredConversationId,
          messages: [...prev.messages, ...newMessages],
          isComplete: turn.isComplete,
        };
        saveToStorage(storageKey, next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "대화를 시작하지 못했어요.");
    } finally {
      setIsThinking(false);
    }
  }, [
    state.userName,
    state.conversationId,
    state.messages.length,
    baselineId,
    mode,
    persistTurns,
    storageKey,
    hardcodedQuestions,
    hardcodedWelcome,
  ]);

  /** 사용자 답변 → 페이스메이커 다음 응답 (리액션 + 질문 또는 마무리). */
  const submitAnswer = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!state.userName) return;

      setError(null);
      const answeredCount = state.messages.filter(
        (m) => m.role === "user-answer",
      ).length;
      const aiQuestions = state.messages.filter(
        (m) => m.role === "ai-question",
      );
      const questionIndex = aiQuestions.length - 1;
      const questionText = aiQuestions[questionIndex]?.text ?? "";
      // 지금 답한 질문이 풀에서 선택된 거면 id 가지고 있음 — qa-pair POST에 동봉.
      const answeredQuestionId = aiQuestions[questionIndex]?.selectedQuestionId ?? "";
      const optimistic: ConversationMessage[] = [
        ...state.messages,
        { role: "user-answer", text: trimmed, questionIndex },
      ];

      // persistTurns 모드인데 conversationId가 아직 없으면 즉석 발급 (defensive)
      const ensuredConversationId =
        persistTurns && !state.conversationId
          ? typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : null
          : state.conversationId;

      setState((prev) => {
        const next: ConversationState = {
          ...prev,
          conversationId: ensuredConversationId,
          messages: optimistic,
        };
        saveToStorage(storageKey, next);
        return next;
      });

      // Hardcoded 모드 — LLM 호출 없이 즉시 다음 turn
      if (hardcodedQuestions) {
        // 방금 추가한 답변이 첫 번째(answeredCount=0)면 Q2로, 두 번째면 마무리.
        const justAnsweredFirst = answeredCount === 0;
        setState((prev) => {
          const appended: ConversationMessage[] = [];
          if (justAnsweredFirst) {
            appended.push({
              role: "ai-question",
              text: hardcodedQuestions[1].text,
              suggestedAnswers: hardcodedQuestions[1].suggestedAnswers,
            });
          }
          const next: ConversationState = {
            ...prev,
            messages: [...prev.messages, ...appended],
            isComplete: !justAnsweredFirst,
          };
          saveToStorage(storageKey, next);
          return next;
        });

        if (persistTurns && ensuredConversationId && questionText) {
          persistQaPair(
            {
              conversationId: ensuredConversationId,
              questionIndex,
              questionText,
              reactionText: null,
              answerText: trimmed,
              isLast: !justAnsweredFirst,
              questionId: answeredQuestionId,
            },
            (qaPairId) => attachQaPairId(setState, storageKey, questionIndex, trimmed, qaPairId),
          );
        }
        return;
      }

      setIsThinking(true);
      try {
        const turn = await callPacemaker(state.userName, optimistic, baselineId, mode);
        setState((prev) => {
          const appended: ConversationMessage[] = [];
          if (turn.reaction.trim()) {
            appended.push({ role: "ai-reaction", text: turn.reaction });
          }
          if (!turn.isComplete) {
            appended.push({
              role: "ai-question",
              text: turn.question,
              suggestedAnswers: turn.suggestedAnswers,
              selectedQuestionId: turn.selectedQuestionId ?? "",
            });
          }
          const next: ConversationState = {
            ...prev,
            messages: [...prev.messages, ...appended],
            isComplete: turn.isComplete,
          };
          saveToStorage(storageKey, next);
          return next;
        });

        if (persistTurns && ensuredConversationId && questionText) {
          persistQaPair(
            {
              conversationId: ensuredConversationId,
              questionIndex,
              questionText,
              reactionText: turn.reaction.trim() ? turn.reaction.trim() : null,
              answerText: trimmed,
              isLast: turn.isComplete,
              questionId: answeredQuestionId,
            },
            (qaPairId) => attachQaPairId(setState, storageKey, questionIndex, trimmed, qaPairId),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "답변 전송에 실패했어요.");
      } finally {
        setIsThinking(false);
      }
    },
    [
      state.userName,
      state.conversationId,
      state.messages,
      baselineId,
      mode,
      persistTurns,
      storageKey,
      hardcodedQuestions,
    ],
  );

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey);
    }
    // userName은 유지하고 conversationId·messages·isComplete만 초기화 —
    // 같은 사용자가 새 세션 시작할 때 다시 로그인하지 않아도 되도록.
    setState((prev) => ({
      ...initial,
      userName: prev.userName,
    }));
    setError(null);
  }, [storageKey]);

  return {
    state,
    hydrated,
    isThinking,
    error,
    login,
    startConversation,
    submitAnswer,
    reset,
  };
}
