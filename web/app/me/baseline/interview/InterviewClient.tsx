"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BASELINE_QUESTIONS,
  TOTAL_STEPS,
  stepToLocation,
  type ChoiceBranch,
  type InterviewAnswers,
} from "@/lib/me/baseline-interview-questions";
import { useAudioRecorder } from "@/lib/me/use-audio-recorder";

/**
 * 셀프인터뷰 진행 — 3 Q-block × (객관식 → 음성) = 6 step + 완료.
 *
 * progress prop으로 받은 (currentStep, answers)에서 이어서 시작.
 * 매 step 완료 시 PUT /api/me/baseline-interview/progress 로 DB 저장 →
 * 이탈해도 다음에 정확히 그 자리에서 이어짐.
 *
 * step === TOTAL_STEPS (6) 도달 시 완료 화면 (Phase 3d 합성 진입 placeholder).
 */
export function InterviewClient({
  initialStep,
  initialAnswers,
}: {
  initialStep: number;
  initialAnswers: InterviewAnswers;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<InterviewAnswers>(initialAnswers);
  const [saving, setSaving] = useState(false);

  const location = useMemo(() => stepToLocation(step), [step]);
  const block = location ? BASELINE_QUESTIONS[location.blockIndex] : null;

  async function persist(nextStep: number, nextAnswers: InterviewAnswers) {
    setSaving(true);
    try {
      const res = await fetch("/api/me/baseline-interview/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep: nextStep, answers: nextAnswers }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        console.error("[interview persist]", res.status, detail);
      }
    } catch (err) {
      console.error("[interview persist]", err);
    } finally {
      setSaving(false);
    }
  }

  function handleChoice(value: ChoiceBranch) {
    if (!block) return;
    const updated: InterviewAnswers = {
      ...answers,
      [block.id]: { ...(answers[block.id] ?? { voice: "" }), choice: value },
    };
    const next = step + 1;
    setAnswers(updated);
    setStep(next);
    void persist(next, updated);
  }

  function handleVoiceSubmit(text: string) {
    if (!block) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const existing = answers[block.id];
    if (!existing?.choice) return;
    const updated: InterviewAnswers = {
      ...answers,
      [block.id]: { choice: existing.choice, voice: trimmed },
    };
    const next = step + 1;
    setAnswers(updated);
    setStep(next);
    void persist(next, updated);
  }

  function goBack() {
    if (step === 0) {
      router.push("/me");
      return;
    }
    const prev = step - 1;
    setStep(prev);
    // 뒤로 갈 때는 progress 갱신 안 함 — 답변 자체는 유지하고 step만 client 측에서 이동
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        <Header step={step} onBack={goBack} />

        <section className="flex-1 px-6 pt-8 pb-6 flex flex-col">
          {location && block ? (
            location.sub === "choice" ? (
              <ChoiceStep
                key={`${block.id}-choice`}
                blockId={block.id}
                title={block.choice.text}
                options={block.choice.options}
                onSelect={handleChoice}
                saving={saving}
              />
            ) : (
              <VoiceStep
                key={`${block.id}-voice`}
                blockId={block.id}
                branch={answers[block.id]?.choice ?? "knows"}
                onSubmit={handleVoiceSubmit}
                saving={saving}
              />
            )
          ) : (
            <CompleteStep />
          )}
        </section>
      </div>
    </main>
  );
}

/* ─────────────────────── Header ─────────────────────── */

function Header({ step, onBack }: { step: number; onBack: () => void }) {
  const inBounds = step < TOTAL_STEPS;
  const display = Math.min(step + 1, TOTAL_STEPS);
  const widthPct = inBounds
    ? ((step + 1) / TOTAL_STEPS) * 100
    : 100;

  return (
    <header className="px-6 pt-8">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로 가기"
        className="w-9 h-9 -ml-2 flex items-center justify-center rounded-md text-fg-light hover:bg-surface-card active:bg-surface-card transition-colors no-select"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="mt-5">
        <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C6D5F5] transition-[width] duration-300 ease-out"
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <p className="text-right text-xs text-fg-light-soft mt-1.5">
          {display}/{TOTAL_STEPS}
        </p>
      </div>
    </header>
  );
}

/* ─────────────────────── Choice step ─────────────────────── */

function ChoiceStep({
  blockId,
  title,
  options,
  onSelect,
  saving,
}: {
  blockId: string;
  title: string;
  options: { value: ChoiceBranch; label: string }[];
  onSelect: (v: ChoiceBranch) => void;
  saving: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col animate-fade-up">
      <p className="text-xs font-medium text-fg-light-soft mb-3">
        잠깐 멈추고, 다음 질문에 답해보세요
      </p>
      <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
        {title}
      </h1>

      <div className="mt-12 flex-1 flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={`${blockId}-${opt.value}`}
            type="button"
            onClick={() => onSelect(opt.value)}
            disabled={saving}
            className="w-full py-5 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-base font-semibold text-left px-5 hover:bg-surface-card active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Voice step ─────────────────────── */

function VoiceStep({
  blockId,
  branch,
  onSubmit,
  saving,
}: {
  blockId: string;
  branch: ChoiceBranch;
  onSubmit: (text: string) => void;
  saving: boolean;
}) {
  const block = BASELINE_QUESTIONS.find((b) => b.id === blockId)!;
  const config = block.voice[branch];

  // V2: MediaRecorder + Gemini transcribe로 모든 브라우저 통일.
  // Web Speech API는 모바일 Chrome·Samsung Internet에서 중복·자동 종료 버그.
  const recorder = useAudioRecorder();
  const [text, setText] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  // 녹음 종료(blob 도착) → /api/me/transcribe → text append
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
        setText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
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
  const busy = transcribing || isRecording || isRequesting || saving;
  const errorMsg = transcribeError ?? recorder.error;

  function handleMicClick() {
    if (isRecording) {
      recorder.stop();
    } else {
      setTranscribeError(null);
      if (recState === "error") recorder.reset();
      void recorder.start();
    }
  }

  function handleSubmit() {
    onSubmit(text);
  }

  return (
    <div className="flex-1 flex flex-col animate-fade-up">
      <p className="text-xs font-medium text-fg-light-soft mb-3">
        차분하고 낮은 목소리로
      </p>
      <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
        {config.text}
      </h1>
      {config.helper && (
        <p className="mt-3 text-sm text-fg-light-soft leading-relaxed">
          {config.helper}
        </p>
      )}

      {/* Mic */}
      <div className="mt-8 flex flex-col items-center">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={saving || transcribing || isRequesting}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all no-select ${
            isRecording
              ? "bg-[#f44a4a] text-white shadow-lg animate-pulse"
              : "bg-brand-500 text-white hover:bg-brand-600 active:scale-95"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
        >
          {isRecording ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {isRecording ? (
          <p className="mt-3 text-xs text-fg-light-soft animate-pulse">
            녹음 중 — 정지를 누르면 텍스트로 변환돼요
          </p>
        ) : transcribing ? (
          <p className="mt-3 text-xs text-fg-light-soft animate-pulse">
            음성을 텍스트로 옮기는 중…
          </p>
        ) : isRequesting ? (
          <p className="mt-3 text-xs text-fg-light-soft">
            마이크 권한을 요청 중…
          </p>
        ) : (
          <p className="mt-3 text-[11px] text-fg-light-muted">
            마이크로 답하거나 아래에 직접 작성하세요
          </p>
        )}

        {errorMsg && (
          <p className="mt-3 text-xs text-record bg-record/5 px-3 py-2 rounded-[8px] max-w-xs text-center">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Editable textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        placeholder="마이크로 답하거나 직접 작성하세요"
        className="mt-4 w-full min-h-[120px] px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
      />

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || busy}
          className="w-full py-4 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-base font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-select"
        >
          {saving ? "저장 중…" : "다음"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── Complete step (LLM 합성) ─────────────────────── */

type SynthesisPhase = "synthesizing" | "done" | "error";

function CompleteStep() {
  const router = useRouter();
  const [phase, setPhase] = useState<SynthesisPhase>("synthesizing");
  const [error, setError] = useState<string | null>(null);
  // StrictMode·HMR로 인한 중복 호출 방지
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void synthesize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function synthesize() {
    setPhase("synthesizing");
    setError(null);
    try {
      const res = await fetch("/api/me/baseline-interview/complete", {
        method: "POST",
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `합성 실패 (${res.status})`);
        setPhase("error");
        return;
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setPhase("error");
    }
  }

  if (phase === "synthesizing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-up">
        <div className="text-5xl animate-pulse">✨</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          보고서를 만들고 있어요
        </h1>
        <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
          답변을 정리해 가치 있는 것·좋아하는 것·잘하는 것으로
          <br />
          묶고 있어요. 약 10~30초 걸려요.
        </p>
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-up">
        <div className="text-5xl">😢</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          보고서를 만들지 못했어요
        </h1>
        <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px] max-w-xs">
          {error ?? "알 수 없는 오류"}
        </p>
        <p className="text-xs text-fg-light-muted max-w-xs">
          답변은 저장돼 있어요. 다시 시도해도 안 되면 운영자에게 알려주세요.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => router.push("/me")}
            className="px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            홈으로
          </button>
          <button
            type="button"
            onClick={() => {
              startedRef.current = false;
              void synthesize();
            }}
            className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // phase === "done"
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-up">
      <div className="text-5xl">🎉</div>
      <h1 className="text-2xl font-extrabold tracking-tight">
        보고서가 준비됐어요
      </h1>
      <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
        답변이 안전하게 저장됐고,
        <br />
        나만의 첫 보고서가 만들어졌어요.
      </p>
      <button
        type="button"
        onClick={() => {
          router.push("/me");
          router.refresh();
        }}
        className="mt-2 px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold transition-colors"
      >
        보고서 보러 가기
      </button>
    </div>
  );
}
