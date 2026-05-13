"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BaselineShape } from "@/lib/me/baseline-shape";

/**
 * /me/baseline/import — 기존 인터뷰 자료 paste → LLM 정리 → 검토 → 저장.
 *
 * State machine:
 *   - 'paste'   : 큰 textarea + "정리하기" 버튼
 *   - 'parsing' : LLM 호출 중 (spinner)
 *   - 'review'  : 정리 결과 표시. 사용자가 title·description·insight·keywords 편집 가능
 *   - 'saving'  : POST /api/me/baseline-report 중
 *   - 완료 시 router.push("/me") → MeLandingClient 로 자연스럽게 진입
 */

type Phase = "paste" | "parsing" | "review" | "saving";

export function ImportClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("paste");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<BaselineShape | null>(null);

  async function handleParse() {
    setError(null);
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError("자료가 너무 짧아요. 최소 20자 이상 입력해주세요.");
      return;
    }
    setPhase("parsing");
    try {
      const res = await fetch("/api/me/baseline-interview/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `정리 실패 (${res.status})`);
        setPhase("paste");
        return;
      }
      const data = (await res.json()) as { parsed: BaselineShape };
      setParsed(data.parsed);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "정리 중 오류가 발생했어요.");
      setPhase("paste");
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch("/api/me/baseline-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "import", report: parsed }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `저장 실패 (${res.status})`);
        setPhase("review");
        return;
      }
      router.push("/me");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했어요.");
      setPhase("review");
    }
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        <Header onBack={() => router.push("/me")} phase={phase} />

        {phase === "paste" || phase === "parsing" ? (
          <PasteView
            text={text}
            setText={setText}
            parsing={phase === "parsing"}
            error={error}
            onParse={handleParse}
          />
        ) : (
          <ReviewView
            parsed={parsed!}
            setParsed={(next) => setParsed(next)}
            saving={phase === "saving"}
            error={error}
            onSave={handleSave}
            onBack={() => {
              setPhase("paste");
              setError(null);
            }}
          />
        )}
      </div>
    </main>
  );
}

/* ─────────────────────── Header ─────────────────────── */

function Header({ onBack, phase }: { onBack: () => void; phase: Phase }) {
  const label =
    phase === "paste" || phase === "parsing"
      ? "1. 자료 붙여넣기"
      : "2. 정리 결과 검토";
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
      <p className="mt-5 text-xs font-medium text-fg-light-soft tracking-wide">
        {label}
      </p>
    </header>
  );
}

/* ─────────────────────── Paste view ─────────────────────── */

function PasteView({
  text,
  setText,
  parsing,
  error,
  onParse,
}: {
  text: string;
  setText: (v: string) => void;
  parsing: boolean;
  error: string | null;
  onParse: () => void;
}) {
  return (
    <section className="flex-1 px-6 pt-6 pb-6 flex flex-col animate-fade-up">
      <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
        기존 인터뷰 자료를
        <br />
        붙여넣어 주세요
      </h1>
      <p className="mt-3 text-sm text-fg-light-soft leading-relaxed">
        PDF·메모·노트 어떤 형식이든 통째로 OK.
        <br />
        AI가 읽고 <b>가치 있는 것 · 좋아하는 것 · 잘하는 것</b>으로 정리해줘요.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={parsing}
        placeholder="여기에 붙여넣어 주세요…"
        className="mt-6 flex-1 min-h-[280px] w-full px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      />

      <p className="mt-2 text-xs text-fg-light-muted">
        {text.length}자 (최소 20자)
      </p>

      {error && (
        <p className="mt-3 text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onParse}
        disabled={parsing || text.trim().length < 20}
        className="mt-6 w-full py-4 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-base font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-select"
      >
        {parsing ? "정리 중… (10~30초)" : "정리하기"}
      </button>
    </section>
  );
}

/* ─────────────────────── Review view ─────────────────────── */

function ReviewView({
  parsed,
  setParsed,
  saving,
  error,
  onSave,
  onBack,
}: {
  parsed: BaselineShape;
  setParsed: (next: BaselineShape) => void;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onBack: () => void;
}) {
  function updateHeadline(value: string) {
    setParsed({ ...parsed, headline: value });
  }

  function updatePart(partIdx: number, patch: Partial<BaselineShape["parts"][number]>) {
    const nextParts = parsed.parts.map((p, i) => (i === partIdx ? { ...p, ...patch } : p));
    setParsed({ ...parsed, parts: nextParts });
  }

  function updateItem(
    partIdx: number,
    itemIdx: number,
    patch: Partial<BaselineShape["parts"][number]["items"][number]>,
  ) {
    const part = parsed.parts[partIdx];
    const nextItems = part.items.map((it, i) => (i === itemIdx ? { ...it, ...patch } : it));
    updatePart(partIdx, { items: nextItems });
  }

  return (
    <section className="flex-1 px-6 pt-6 pb-8 flex flex-col gap-5 animate-fade-up overflow-y-auto">
      <div>
        <p className="text-xs font-medium text-fg-light-soft mb-2">한 줄 요약</p>
        <input
          type="text"
          value={parsed.headline}
          onChange={(e) => updateHeadline(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light text-base font-semibold leading-snug focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
        />
      </div>

      {parsed.parts.map((part, partIdx) => (
        <PartCard
          key={part.partTitle}
          part={part}
          partIdx={partIdx}
          updateItem={updateItem}
          updatePart={(patch) => updatePart(partIdx, patch)}
          disabled={saving}
        />
      ))}

      {error && (
        <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="flex-1 py-4 rounded-full bg-surface-card text-fg-light text-base font-semibold transition-colors disabled:opacity-50 no-select"
        >
          다시 붙여넣기
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed no-select"
        >
          {saving ? "저장 중…" : "이대로 저장"}
        </button>
      </div>
    </section>
  );
}

function PartCard({
  part,
  partIdx,
  updateItem,
  updatePart,
  disabled,
}: {
  part: BaselineShape["parts"][number];
  partIdx: number;
  updateItem: (
    partIdx: number,
    itemIdx: number,
    patch: Partial<BaselineShape["parts"][number]["items"][number]>,
  ) => void;
  updatePart: (patch: Partial<BaselineShape["parts"][number]>) => void;
  disabled: boolean;
}) {
  return (
    <article className="p-4 rounded-[12px] border border-border-line bg-surface-paper">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block px-2 py-0.5 rounded-full bg-selected-bg text-[10px] font-semibold text-purple-deep tracking-wide">
          Part {partIdx + 1}
        </span>
        <h2 className="text-base font-bold text-fg-light">{part.partTitle}</h2>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {part.items.map((item, itemIdx) => (
          <div key={itemIdx} className="border-l-2 border-brand-200 pl-3">
            <input
              type="text"
              value={item.title}
              onChange={(e) =>
                updateItem(partIdx, itemIdx, { title: e.target.value })
              }
              disabled={disabled}
              className="w-full font-semibold text-sm text-fg-light bg-transparent px-0 py-0.5 focus:outline-none focus:bg-surface-card rounded disabled:opacity-50"
            />
            <textarea
              value={item.description.join("\n\n")}
              onChange={(e) =>
                updateItem(partIdx, itemIdx, {
                  description: e.target.value.split(/\n\n+/).filter((s) => s.trim()),
                })
              }
              disabled={disabled}
              className="mt-1 w-full text-sm text-fg-light-soft bg-transparent leading-relaxed resize-none focus:outline-none focus:bg-surface-card rounded px-0 py-0.5 disabled:opacity-50"
              rows={Math.max(2, item.description.length * 2)}
            />
          </div>
        ))}
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 rounded-[8px] bg-selected-bg">
        <p className="text-[10px] font-semibold text-purple-deep mb-1 tracking-wide">
          💡 인사이트
        </p>
        <textarea
          value={part.insight}
          onChange={(e) => updatePart({ insight: e.target.value })}
          disabled={disabled}
          className="w-full text-sm text-fg-light bg-transparent leading-relaxed resize-none focus:outline-none focus:bg-white/40 rounded p-0 disabled:opacity-50"
          rows={Math.max(2, Math.ceil(part.insight.length / 30))}
        />
      </div>

      {/* Keywords */}
      <div className="mt-3">
        <p className="text-[10px] font-semibold text-fg-light-muted mb-1.5 tracking-wide">
          키워드
        </p>
        <input
          type="text"
          value={part.keywords.join(", ")}
          onChange={(e) =>
            updatePart({
              keywords: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          disabled={disabled}
          className="w-full text-xs text-fg-light-soft bg-transparent focus:outline-none focus:bg-surface-card rounded px-0 py-0.5 disabled:opacity-50"
          placeholder="쉼표로 구분"
        />
      </div>
    </article>
  );
}

