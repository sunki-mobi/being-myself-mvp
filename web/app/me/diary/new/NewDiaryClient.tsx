"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * /me/diary/new state machine — paste → review → write → save → done.
 *
 * 스펙 §3 흐름. 이미 오늘 작성한 entry가 있으면 review·writing 단계부터 진입
 * (existing prop).
 */

/* ───────── Types (synthesize API output 거울) ───────── */

type ItemT = { time: string; desc: string; duration: string };

type DirectT = {
  kr_code: string;
  kr_title: string;
  total_time: string;
  items: ItemT[];
};

type TranslatedT = {
  meaning: string;
  total_time: string;
  items: ItemT[];
  ai_note: string;
};

type OpenQuestionT = { task: string; prompt: string };

type SuggestedQuestionT = { source: string; body: string };

type ContributionFlow = {
  direct: DirectT[];
  translated: TranslatedT[];
  open_questions: OpenQuestionT[];
  suggested_questions: SuggestedQuestionT[];
};

type Existing = {
  eveningReport: string;
  contributionFlow: Record<string, unknown>;
  aiQuestion: string;
  aiQuestionSource: string;
  answer: string;
  freeNote: string;
} | null;

type Phase = "paste" | "synthesizing" | "review" | "writing" | "saving" | "done";

/* ───────── Component ───────── */

export function NewDiaryClient({ existing }: { existing: Existing }) {
  const router = useRouter();

  const initialPhase: Phase = existing ? "writing" : "paste";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [eveningReport, setEveningReport] = useState(
    existing?.eveningReport ?? "",
  );
  const [flow, setFlow] = useState<ContributionFlow | null>(
    existing?.contributionFlow
      ? (existing.contributionFlow as unknown as ContributionFlow)
      : null,
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<SuggestedQuestionT | null>(
      existing
        ? { source: existing.aiQuestionSource, body: existing.aiQuestion }
        : null,
    );
  const [answer, setAnswer] = useState(existing?.answer ?? "");
  const [freeNote, setFreeNote] = useState(existing?.freeNote ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSynthesize() {
    setError(null);
    if (eveningReport.trim().length < 30) {
      setError("퇴근 보고를 최소 30자 이상 입력해주세요.");
      return;
    }
    setPhase("synthesizing");
    try {
      const res = await fetch("/api/me/diary/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evening_report: eveningReport.trim() }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `정리 실패 (${res.status})`);
        setPhase("paste");
        return;
      }
      const data = (await res.json()) as { contribution_flow: ContributionFlow };
      setFlow(data.contribution_flow);
      // suggested_questions가 비어있으면 안전하게 fallback
      const firstQ = data.contribution_flow.suggested_questions?.[0] ?? null;
      setSelectedQuestion(firstQ);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setPhase("paste");
    }
  }

  async function handleSave() {
    if (!flow || !selectedQuestion) return;
    if (!answer.trim() && !freeNote.trim()) {
      setError("질문에 답하거나 자유롭게 한 줄 적어주세요.");
      return;
    }
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch("/api/me/diary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evening_report: eveningReport,
          contribution_flow: flow,
          ai_question: selectedQuestion.body,
          ai_question_source: selectedQuestion.source,
          answer: answer.trim() || null,
          free_note: freeNote.trim() || null,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `저장 실패 (${res.status})`);
        setPhase("writing");
        return;
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setPhase("writing");
    }
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        <Header phase={phase} onBack={() => router.push("/me/do")} />

        {phase === "paste" || phase === "synthesizing" ? (
          <PasteStep
            text={eveningReport}
            setText={setEveningReport}
            busy={phase === "synthesizing"}
            error={error}
            onSubmit={handleSynthesize}
          />
        ) : phase === "review" && flow ? (
          <ReviewStep
            flow={flow}
            selectedQuestion={selectedQuestion}
            onSelectQuestion={setSelectedQuestion}
            onNext={() => setPhase("writing")}
          />
        ) : (phase === "writing" || phase === "saving") && flow && selectedQuestion ? (
          <WritingStep
            flow={flow}
            question={selectedQuestion}
            answer={answer}
            setAnswer={setAnswer}
            freeNote={freeNote}
            setFreeNote={setFreeNote}
            busy={phase === "saving"}
            error={error}
            onSave={handleSave}
            onBackToReview={() => {
              setError(null);
              setPhase("review");
            }}
          />
        ) : phase === "done" ? (
          <DoneStep
            onSeeDiary={() => router.push("/me/diary")}
            onAnother={() => router.push("/me/do")}
          />
        ) : null}
      </div>
    </main>
  );
}

/* ───────── Header (phase indicator) ───────── */

function Header({ phase, onBack }: { phase: Phase; onBack: () => void }) {
  const label =
    phase === "paste" || phase === "synthesizing"
      ? "1. 퇴근 보고 붙여넣기"
      : phase === "review"
        ? "2. 오늘의 기여 흐름"
        : phase === "writing" || phase === "saving"
          ? "3. 오늘의 한 줄"
          : "완료";
  return (
    <header className="px-6 pt-8 animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로 가기"
        className="w-9 h-9 -ml-2 flex items-center justify-center rounded-md text-fg-light hover:bg-surface-card transition-colors no-select"
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
      <p className="mt-5 text-xs font-medium text-fg-light-soft tracking-wide">
        {label}
      </p>
    </header>
  );
}

/* ───────── Step 1: paste ───────── */

function PasteStep({
  text,
  setText,
  busy,
  error,
  onSubmit,
}: {
  text: string;
  setText: (v: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <section className="flex-1 px-6 pt-6 pb-6 flex flex-col animate-fade-up-delay-1">
      <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
        오늘 한 일을
        <br />
        통째로 붙여넣어 주세요
      </h1>
      <p className="mt-3 text-sm text-fg-light-soft leading-relaxed">
        퇴근 보고·메모 어떤 형식이든 OK. 시간대와 일이 묶여 있으면 더 풍부해요.
        <br />
        AI가 OKR과 회사 미션에 닿는 결로 정리해줘요.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        placeholder={`예시\n08:36~09:25 어떤 일\n10:00~11:23 다른 일\n...`}
        className="mt-6 flex-1 min-h-[280px] w-full px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      />
      <p className="mt-2 text-xs text-fg-light-muted">
        {text.length}자 (최소 30자)
      </p>

      {error ? (
        <p className="mt-3 text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy || text.trim().length < 30}
        className="mt-6 w-full py-4 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-base font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-select"
      >
        {busy ? "AI가 읽고 있어요… (약 10초)" : "기여 흐름 만들기"}
      </button>
    </section>
  );
}

/* ───────── Step 2: review ───────── */

function ReviewStep({
  flow,
  selectedQuestion,
  onSelectQuestion,
  onNext,
}: {
  flow: ContributionFlow;
  selectedQuestion: SuggestedQuestionT | null;
  onSelectQuestion: (q: SuggestedQuestionT) => void;
  onNext: () => void;
}) {
  return (
    <section className="flex-1 px-6 pt-6 pb-8 flex flex-col gap-5 animate-fade-up-delay-1 overflow-y-auto">
      {flow.direct.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold text-purple-deep tracking-wide mb-2">
            Direct contribution
          </p>
          <div className="flex flex-col gap-3">
            {flow.direct.map((d, i) => (
              <DirectCard key={i} d={d} />
            ))}
          </div>
        </div>
      ) : null}

      {flow.translated.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold text-brand-600 tracking-wide mb-2">
            Translated contribution
          </p>
          <div className="flex flex-col gap-3">
            {flow.translated.map((t, i) => (
              <TranslatedCard key={i} t={t} />
            ))}
          </div>
        </div>
      ) : null}

      {flow.open_questions.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold text-fg-light-muted tracking-wide mb-2">
            Open question — AI도 모르는 일
          </p>
          <div className="flex flex-col gap-3">
            {flow.open_questions.map((q, i) => (
              <article
                key={i}
                className="p-3 rounded-[10px] border border-dashed border-border-line"
              >
                <p className="text-sm font-semibold text-fg-light">{q.task}</p>
                <p className="mt-1 text-xs text-fg-light-soft leading-relaxed">
                  {q.prompt}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-fg-light-muted italic">
          오늘은 모두 분류됐어요. 다행이에요 — 또는 AI가 자신만만한 걸 수도 있고요.
        </p>
      )}

      {flow.suggested_questions.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold text-fg-light-soft mb-2">
            오늘 일기로 적어볼 질문 — 한 결을 고르세요
          </p>
          <div className="flex flex-col gap-2">
            {flow.suggested_questions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className={`text-left p-3 rounded-[10px] border transition-colors ${
                  selectedQuestion === q
                    ? "border-brand-500 bg-selected-bg"
                    : "border-border-line hover:bg-surface-card"
                }`}
              >
                <p className="text-[10px] font-semibold text-purple-deep mb-1 tracking-wide">
                  {q.source}
                </p>
                <div
                  className="text-sm text-fg-light leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: q.body }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={!selectedQuestion}
        className="mt-4 w-full py-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-select"
      >
        오늘의 한 줄로 마무리하기
      </button>
    </section>
  );
}

function DirectCard({ d }: { d: DirectT }) {
  return (
    <article className="p-3 rounded-[10px] border border-border-line bg-selected-bg">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-mono text-[11px] font-semibold text-purple-deep">
          {d.kr_code}
        </span>
        <span className="text-xs font-medium text-fg-light-soft">
          {d.total_time}
        </span>
      </div>
      <p className="text-sm font-semibold text-fg-light mb-2">{d.kr_title}</p>
      <ul className="text-xs text-fg-light-soft leading-relaxed space-y-0.5">
        {d.items.map((it, i) => (
          <li key={i}>
            <span className="font-mono text-[11px] text-fg-light-muted">
              {it.time}
            </span>{" "}
            · {it.desc}
            {it.duration && it.duration !== "—" ? (
              <span className="text-fg-light-muted"> ({it.duration})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

function TranslatedCard({ t }: { t: TranslatedT }) {
  return (
    <article className="p-3 rounded-[10px] border border-border-line">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-fg-light">{t.meaning}</span>
        <span className="text-xs font-medium text-fg-light-soft">
          {t.total_time}
        </span>
      </div>
      <ul className="text-xs text-fg-light-soft leading-relaxed space-y-0.5 mb-2">
        {t.items.map((it, i) => (
          <li key={i}>
            <span className="font-mono text-[11px] text-fg-light-muted">
              {it.time}
            </span>{" "}
            · {it.desc}
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-light-soft italic leading-relaxed pt-2 border-t border-border-line-soft">
        {t.ai_note}
      </p>
    </article>
  );
}

/* ───────── Step 3: writing ───────── */

function WritingStep({
  flow,
  question,
  answer,
  setAnswer,
  freeNote,
  setFreeNote,
  busy,
  error,
  onSave,
  onBackToReview,
}: {
  flow: ContributionFlow;
  question: SuggestedQuestionT;
  answer: string;
  setAnswer: (v: string) => void;
  freeNote: string;
  setFreeNote: (v: string) => void;
  busy: boolean;
  error: string | null;
  onSave: () => void;
  onBackToReview: () => void;
}) {
  void flow;
  const canSave = (answer.trim() || freeNote.trim()) && !busy;
  return (
    <section className="flex-1 px-6 pt-6 pb-8 flex flex-col gap-5 animate-fade-up-delay-1 overflow-y-auto">
      <div className="p-4 rounded-[12px] bg-selected-bg">
        <p className="text-[10px] font-semibold text-purple-deep mb-2 tracking-wide">
          {question.source}
        </p>
        <div
          className="text-base text-fg-light leading-relaxed"
          dangerouslySetInnerHTML={{ __html: question.body }}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-fg-light-soft">
          질문에 답해보기 (선택)
        </span>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={busy}
          placeholder="떠오르는 대로, 한 문장이라도"
          className="min-h-[100px] w-full px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-fg-light-soft">
          자유롭게 적기 (선택)
        </span>
        <textarea
          value={freeNote}
          onChange={(e) => setFreeNote(e.target.value)}
          disabled={busy}
          placeholder="질문에 묶이지 않은 오늘의 감각"
          className="min-h-[100px] w-full px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
        />
      </label>

      <p className="text-xs text-fg-light-muted text-center">
        🔒 본인만 봅니다. 회사의 누구도 접근할 수 없어요.
      </p>

      {error ? (
        <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBackToReview}
          disabled={busy}
          className="flex-1 py-4 rounded-full bg-surface-card text-fg-light text-base font-semibold transition-colors disabled:opacity-50"
        >
          질문 다시 고르기
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex-1 py-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "저장 중…" : "오늘 마무리하기"}
        </button>
      </div>
    </section>
  );
}

/* ───────── Done ───────── */

function DoneStep({
  onSeeDiary,
  onAnother,
}: {
  onSeeDiary: () => void;
  onAnother: () => void;
}) {
  return (
    <section className="flex-1 flex flex-col items-center justify-center text-center gap-6 px-6 py-12 animate-fade-up">
      <div className="text-5xl">📔</div>
      <h1 className="text-2xl font-extrabold tracking-tight">
        오늘의 일기가 저장됐어요
      </h1>
      <p className="text-sm text-fg-light-soft leading-relaxed max-w-xs">
        🔒 본인만 봅니다.
        <br />
        회사의 누구도 접근할 수 없어요.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onAnother}
          className="px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          오늘 할 일로
        </button>
        <button
          type="button"
          onClick={onSeeDiary}
          className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          내 일기 보기
        </button>
      </div>
    </section>
  );
}
