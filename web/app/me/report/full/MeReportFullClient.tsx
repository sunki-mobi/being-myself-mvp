"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BaselineReport,
  BaselinePart,
  BaselineQuestion,
  BaselineInsight,
} from "@/lib/me/baseline-report";

/**
 * /me/report/full client — server에서 받은 사용자 baseline 전체 렌더.
 *
 * 3 Part 탭, 각 Part의 preface·examples·closing(템플릿) + items·insight(사용자 본문).
 * 코치인터뷰는 새 사용자엔 빈 배열이라 토글 자체가 안 보이게.
 */
export function MeReportFullClient({ baseline }: { baseline: BaselineReport }) {
  const router = useRouter();
  const [activePart, setActivePart] = useState(0);

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <header className="gradient-hero text-fg-dark px-6 pt-12 pb-12 rounded-b-[2rem] relative animate-fade-up">
          <button
            type="button"
            onClick={() => router.push("/me/report")}
            aria-label="오늘의 보고서로"
            className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 text-fg-dark-soft"
              aria-hidden
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <p className="text-xs font-medium text-fg-dark-soft mb-3 mt-2">
            {baseline.userName}님의 셀프인터뷰 보고서 · 전체
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-fg-dark-soft">내가 진정 하고 싶은 일은</span>
            <br />
            <span className="text-fg-dark">{baseline.headline}</span>
            <br />
            <span className="text-fg-dark-soft">이라고 합니다.</span>
          </h1>
          <p className="mt-4 text-xs text-fg-dark-soft leading-relaxed">
            {baseline.intro}
          </p>
        </header>

        <nav className="px-6 pt-8 pb-2">
          <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
            {baseline.parts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePart(idx)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  activePart === idx
                    ? "bg-fg-light text-white"
                    : "bg-surface-card text-fg-light-soft hover:bg-brand-50"
                }`}
              >
                Part {idx + 1}. {p.partTitle}
              </button>
            ))}
          </div>
        </nav>

        <section className="flex-1 px-6 py-6">
          <PartBody key={activePart} part={baseline.parts[activePart]} />
        </section>

        {baseline.closingNote ? (
          <section className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle">
              <p className="text-xs font-semibold text-fg-light-soft mb-2">
                코치인터뷰 소감
              </p>
              <p className="text-sm text-fg-light leading-relaxed">
                {baseline.closingNote}
              </p>
            </div>
          </section>
        ) : null}

        <section className="px-6 pb-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/me/report")}
            className="w-full px-6 py-3 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            오늘의 보고서로 돌아가기
          </button>
        </section>
      </div>
    </main>
  );
}

function PartBody({ part }: { part: BaselinePart }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div
        className="p-5 rounded-3xl"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 60%, var(--grad-stop-3) 100%)",
        }}
      >
        <span className="inline-block px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-semibold text-fg-light tracking-wide mb-2">
          #셀프인터뷰
        </span>
        <h2 className="text-xl font-bold text-fg-light leading-snug">
          {part.partTitle}{" "}
          <span className="text-sm font-medium text-fg-light/70 ml-1">
            {part.partTitleEn}
          </span>
        </h2>
      </div>

      <p className="text-sm text-fg-light leading-relaxed">{part.preface}</p>

      <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
        <p className="text-xs font-semibold text-brand-600 mb-2">💡 예를 들어</p>
        <ul className="text-sm text-fg-light leading-relaxed space-y-1">
          {part.examples.map((ex, idx) => (
            <li key={idx}>· {ex}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-fg-light-soft leading-relaxed">
        {part.closing}
      </p>

      {part.questions.map((q, idx) => (
        <QuestionBlock key={idx} q={q} />
      ))}
    </div>
  );
}

function QuestionBlock({ q }: { q: BaselineQuestion }) {
  return (
    <article className="flex flex-col gap-4 pt-2 border-t border-border-subtle">
      <div>
        {q.meta ? (
          <p className="text-xs text-fg-light-soft mb-2">{q.meta}</p>
        ) : null}
        <h3 className="text-base font-semibold text-fg-light leading-snug">
          Q. {q.question}
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {q.items.map((item, idx) => (
          <div key={idx}>
            <h4 className="text-sm font-bold text-fg-light mb-2 pb-2 border-b border-border-subtle">
              {item.title}
            </h4>
            <ul className="space-y-2">
              {item.description.map((d, j) => (
                <li
                  key={j}
                  className="text-sm text-fg-light/90 leading-relaxed pl-3 relative"
                >
                  <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-fg-light-soft" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <InsightCard insight={q.insight} />
      {q.coachInterview.length > 0 ? (
        <CoachInterviewToggle items={q.coachInterview} />
      ) : null}
    </article>
  );
}

function InsightCard({ insight }: { insight: BaselineInsight }) {
  return (
    <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
      <p className="text-sm text-fg-light leading-relaxed">
        <span aria-hidden className="mr-1">
          💡
        </span>
        {insight.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-semibold text-brand-600 self-center mr-1">
          핵심 키워드
        </span>
        {insight.keywords.map((k, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full bg-white/70 text-[11px] text-fg-light"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoachInterviewToggle({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-fg-light-soft hover:text-fg-light transition-colors flex items-center gap-1"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        코치인터뷰 ({items.length})
      </button>
      {open ? (
        <div className="mt-2 pl-3 border-l-2 border-border-subtle flex flex-col gap-2">
          {items.map((line, idx) => (
            <p key={idx} className="text-xs text-fg-light-soft leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
