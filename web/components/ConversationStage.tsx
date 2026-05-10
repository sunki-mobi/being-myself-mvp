"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useConversation,
  type ConversationOptions,
} from "@/lib/conversation";
import { useAudioRecorder } from "@/lib/me/use-audio-recorder";
import { PrimaryButton } from "@/components/PrimaryButton";

/**
 * Conversation 카드 흐름 — /me/conversation, /demo/conversation 공통.
 *
 * 한 화면 = 한 질문. 답변 제출 → AI 리액션 + 다음 질문 → ... → AI가 isComplete
 * 신호로 마무리.
 *
 * Props:
 *   - conversationOptions: useConversation hook에 그대로 전달 (namespace, baselineId)
 *   - userNameDisplay: 헤더에 보일 사용자 이름 (예: 페르소나 name)
 *   - onBack: ← 뒤로 navigation
 *   - completePath: AI 마무리 신호 후 1.4초 뒤 자동 이동할 경로
 */
export function ConversationStage({
  conversationOptions,
  userNameDisplay,
  onBack,
  completePath,
}: {
  conversationOptions: ConversationOptions;
  userNameDisplay: string;
  onBack: () => void;
  completePath: string;
}) {
  const router = useRouter();
  const {
    state,
    hydrated,
    isThinking,
    error,
    startConversation,
    submitAnswer,
  } = useConversation(conversationOptions);
  const [draft, setDraft] = useState("");

  // 첫 진입 시 첫 인사 + 첫 질문 받기
  useEffect(() => {
    if (
      hydrated &&
      state.userName &&
      state.messages.length === 0 &&
      !isThinking
    ) {
      void startConversation();
    }
  }, [
    hydrated,
    state.userName,
    state.messages.length,
    isThinking,
    startConversation,
  ]);

  // 마무리 신호 → 1.4초 후 자동 이동 (마무리 카드 한 박자 보고 넘어감)
  useEffect(() => {
    if (state.isComplete) {
      const t = setTimeout(() => router.push(completePath), 1400);
      return () => clearTimeout(t);
    }
  }, [state.isComplete, router, completePath]);

  if (!hydrated || !state.userName) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  const lastQuestion = [...state.messages]
    .reverse()
    .find((m) => m.role === "ai-question");
  const lastReaction = [...state.messages]
    .reverse()
    .find((m) => m.role === "ai-reaction");
  const lastUserAnswer = [...state.messages]
    .reverse()
    .find((m) => m.role === "user-answer");

  const answeredCount = state.messages.filter(
    (m) => m.role === "user-answer",
  ).length;

  const mode: "thinking" | "complete" | "answering" = state.isComplete
    ? "complete"
    : isThinking
      ? "thinking"
      : "answering";

  function onSubmit() {
    if (!draft.trim() || isThinking) return;
    void submitAnswer(draft);
    setDraft("");
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* Header — 라벤더 그라데이션 (legacy image 11 톤) */}
        <header
          className="px-6 pt-10 pb-8 rounded-b-[2rem]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로"
              className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-white/30 active:bg-white/40 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-fg-light"
                aria-hidden
              >
                <path
                  d="M15 18l-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide">
              #셀프인터뷰
            </span>
          </div>
          <h1 className="text-2xl font-bold text-fg-light leading-snug">
            {userNameDisplay}님의
            <br />
            오늘 이야기
          </h1>
          <p className="mt-2 text-xs text-fg-light/70">
            {answeredCount === 0
              ? "잠깐 나를 정리하는 시간"
              : `Q${answeredCount + (mode === "complete" ? 0 : 1)} · ${answeredCount}개 답변 누적`}
          </p>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col">
          {mode === "thinking" && !lastQuestion ? (
            <CardThinking key="thinking-first" caption="첫 인사를 준비하고 있어요" />
          ) : null}

          {mode === "thinking" && lastQuestion ? (
            <CardThinking
              key={`thinking-${answeredCount}`}
              caption="잠깐 음미해 볼게요"
              userAnswerEcho={lastUserAnswer?.text}
            />
          ) : null}

          {mode === "answering" && lastQuestion ? (
            <CardQuestion
              key={lastQuestion.text}
              questionText={lastQuestion.text}
              reactionText={
                lastReaction && lastUserAnswer ? lastReaction.text : null
              }
              suggestedAnswers={lastQuestion.suggestedAnswers ?? []}
              draft={draft}
              setDraft={setDraft}
              onSubmit={onSubmit}
              disabled={isThinking}
            />
          ) : null}

          {mode === "complete" ? (
            <CardComplete userNameDisplay={userNameDisplay} />
          ) : null}

          {error ? (
            <div className="mt-4 p-4 rounded-2xl bg-brand-50 border border-brand-100">
              <p className="text-xs font-semibold text-brand-600 mb-1">
                잠시 멈췄어요
              </p>
              <p className="text-sm text-fg-light leading-relaxed">{error}</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

/* ─────────────────────── Card variants ─────────────────────── */

function CardQuestion({
  questionText,
  reactionText,
  suggestedAnswers,
  draft,
  setDraft,
  onSubmit,
  disabled,
}: {
  questionText: string;
  reactionText: string | null;
  suggestedAnswers: string[];
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const recorder = useAudioRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  useEffect(() => {
    if (!recorder.blob) return;
    const blob = recorder.blob;
    const mimeType = recorder.mimeType ?? "audio/webm";

    setTranscribing(true);
    setTranscribeError(null);

    const fileName = mimeType.includes("mp4")
      ? "answer.mp4"
      : mimeType.includes("ogg")
        ? "answer.ogg"
        : "answer.webm";
    const fd = new FormData();
    fd.append("audio", blob, fileName);

    let cancelled = false;
    fetch("/api/me/transcribe", { method: "POST", body: fd })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.error ?? `요청 실패 (${res.status})`);
        }
        return res.json();
      })
      .then((data: { text: string }) => {
        if (cancelled) return;
        setDraft(draft.trim() ? `${draft.trim()} ${data.text}` : data.text);
        recorder.reset();
      })
      .catch((err) => {
        if (cancelled) return;
        setTranscribeError(
          err instanceof Error ? err.message : "변환에 실패했어요.",
        );
      })
      .finally(() => {
        if (!cancelled) setTranscribing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.blob]);

  const recState = recorder.state;
  const isRecording = recState === "recording";
  const isRequesting = recState === "requesting";
  const inputBusy = transcribing || isRecording || isRequesting;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* AI illustration 자리 — 사용자 디자인 들어올 때까지 빈 spacing */}
      <div className="h-12" />

      {reactionText ? (
        <div className="px-4 py-3 rounded-2xl bg-brand-50 border border-brand-100 animate-fade-up-delay-1">
          <p className="text-xs leading-relaxed text-fg-light-soft">
            <span className="font-semibold text-brand-600">B </span>
            {reactionText}
          </p>
        </div>
      ) : null}

      <h2 className="text-2xl font-bold leading-snug text-fg-light animate-fade-up-delay-2">
        {questionText}
      </h2>

      {/* 빠른 답변 후보 (demo 모드만 — me 모드에선 빈 배열) */}
      {suggestedAnswers.length > 0 ? (
        <div className="flex flex-col gap-2 animate-fade-up-delay-2">
          <p className="text-[10px] font-semibold text-brand-600 tracking-wide">
            빠른 답변
          </p>
          <div className="flex flex-col gap-2">
            {suggestedAnswers.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDraft(s)}
                disabled={disabled}
                className="text-left px-4 py-2.5 rounded-2xl border border-border-subtle bg-surface-card hover:bg-brand-50 hover:border-brand-200 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <p className="text-sm text-fg-light leading-relaxed">{s}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-fg-light-soft px-1">
            그대로 보내거나, 아래에서 자유롭게 다듬어도 좋아요.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 animate-fade-up-delay-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            transcribing
              ? "음성을 텍스트로 옮기는 중…"
              : isRecording
                ? "녹음 중 — 정지를 누르면 텍스트로 변환돼요"
                : "짧게 한 문장이어도 좋아요. 음성으로도 가능해요."
          }
          disabled={disabled || inputBusy}
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border border-border-subtle bg-surface-card focus:bg-white focus:border-brand-500 outline-none text-base resize-none transition-colors disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />

        <RecorderControl
          recState={recState}
          durationMs={recorder.durationMs}
          recorderError={recorder.error}
          transcribing={transcribing}
          transcribeError={transcribeError}
          onStart={recorder.start}
          onStop={recorder.stop}
          onClearError={() => {
            setTranscribeError(null);
            if (recState === "error") recorder.reset();
          }}
          disabled={disabled}
        />

        <PrimaryButton
          onClick={onSubmit}
          disabled={disabled || inputBusy || !draft.trim()}
        >
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

function RecorderControl({
  recState,
  durationMs,
  recorderError,
  transcribing,
  transcribeError,
  onStart,
  onStop,
  onClearError,
  disabled,
}: {
  recState: "idle" | "requesting" | "recording" | "stopped" | "error";
  durationMs: number;
  recorderError: string | null;
  transcribing: boolean;
  transcribeError: string | null;
  onStart: () => void | Promise<void>;
  onStop: () => void;
  onClearError: () => void;
  disabled: boolean;
}) {
  const error = transcribeError ?? recorderError;

  if (transcribing) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-50 border border-brand-100">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-brand-500/70 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-brand-500/70 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-brand-500/70 rounded-full animate-bounce [animation-delay:0.3s]" />
        </span>
        <p className="text-xs text-fg-light-soft">음성을 텍스트로 옮기는 중</p>
      </div>
    );
  }

  if (recState === "recording") {
    return (
      <button
        type="button"
        onClick={onStop}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border-2 border-red-300 hover:bg-red-100 transition-colors"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <span className="text-sm font-semibold text-red-700 tabular-nums">
          {formatDuration(durationMs)}
        </span>
        <span className="text-xs text-red-600">정지</span>
      </button>
    );
  }

  if (recState === "requesting") {
    return (
      <div className="flex items-center justify-center px-4 py-3 rounded-2xl bg-surface-card border border-border-subtle">
        <p className="text-xs text-fg-light-soft">마이크 권한을 요청 중…</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onClearError();
          void onStart();
        }}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border-subtle bg-white hover:bg-brand-50 active:bg-brand-100 transition-colors disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5 text-brand-600"
          aria-hidden
        >
          <path
            d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-medium text-fg-light">음성으로 답하기</span>
      </button>

      {error ? (
        <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200">
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      ) : null}
    </>
  );
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CardThinking({
  caption,
  userAnswerEcho,
}: {
  caption: string;
  userAnswerEcho?: string;
}) {
  return (
    <div className="flex-1 flex flex-col gap-6 items-center justify-center animate-fade-up">
      {userAnswerEcho ? (
        <div className="w-full max-w-xs px-4 py-3 rounded-2xl bg-fg-light text-white">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {userAnswerEcho}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-brand-500/60 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-2 h-2 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
        <p className="text-xs text-fg-light-soft">{caption}</p>
      </div>
    </div>
  );
}

function CardComplete({ userNameDisplay }: { userNameDisplay: string }) {
  return (
    <div className="flex-1 flex flex-col gap-6 items-center justify-center text-center animate-fade-up">
      {/* 마무리 일러스트 자리 — 사용자 디자인 들어올 때까지 빈 spacing */}
      <div className="h-32" />
      <div>
        <h2 className="text-xl font-bold text-fg-light mb-2">
          오늘은 여기까지예요.
        </h2>
        <p className="text-sm text-fg-light-soft leading-relaxed">
          {userNameDisplay}님이 나눈 이야기를
          <br />한 장으로 모아 볼게요.
        </p>
      </div>
    </div>
  );
}
