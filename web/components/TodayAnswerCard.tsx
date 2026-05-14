"use client";

import { useState } from "react";

export type AnswerCard = {
  subtopics: { title: string; bullets: string[] }[];
  summary: string;
  keywords: string[];
};

/**
 * 오늘 답변 한 개를 잡지 톤으로 정리해주는 카드. answer-card LLM의 출력
 * (subtopics + summary + keywords)을 시각화. /me/report·/demo/report 둘 다 사용.
 *
 * 구조:
 *  Q + 질문
 *  ─ 내 답변 박스 (always-on, 길면 line-clamp + 전체 보기)
 *  ─ AI 정리 박스 (subtopics·요약·키워드)
 */
export function TodayAnswerCard({
  index,
  pair,
  card,
  loading,
}: {
  index: number;
  pair: { question: string; answer: string };
  card: AnswerCard | undefined;
  loading: boolean;
}) {
  return (
    <article
      className="p-5 rounded-[12px] shadow-card"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
      }}
    >
      <p className="text-xs font-semibold text-fg-light mb-1">Q{index}</p>
      <h3 className="text-sm font-bold text-fg-light mb-3 leading-snug">
        {pair.question}
      </h3>

      <MyAnswerBlock answer={pair.answer} />

      {card ? (
        <div className="bg-white/80 rounded-[12px] p-4 flex flex-col gap-3 mt-3">
          {card.subtopics.map((st, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold text-fg-light mb-1.5">
                {st.title}
              </h4>
              <ul className="space-y-1.5">
                {st.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="text-sm text-fg-light/90 leading-relaxed pl-3 relative"
                  >
                    <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-fg-light-soft" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-brand-600 mb-1">요약</p>
            <p className="text-sm text-fg-light leading-relaxed">
              {card.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {card.keywords.map((k, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-brand-100 text-[11px] text-brand-700"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="bg-white/80 rounded-[12px] p-4 mt-3 flex items-center gap-2">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.3s]" />
          </span>
          <p className="text-xs text-fg-light-soft">잡지 톤으로 정리 중</p>
        </div>
      ) : null}
    </article>
  );
}

/**
 * 사용자 본인 답변 인용 박스. 그라데이션 위에 묽은 흰톤(반투명)으로 두어
 * 아래 AI 정리 박스(bg-white/80)와 위계를 구분. 180자 넘으면 line-clamp-4
 * 로 잘라서 보여주고 "전체 보기" 토글.
 */
function MyAnswerBlock({ answer }: { answer: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = answer.length > 180;

  return (
    <div className="bg-white/55 backdrop-blur-[1px] rounded-[10px] px-3.5 py-3 border border-white/50">
      <p className="text-[10px] font-semibold text-fg-light-soft tracking-wide mb-1.5">
        내 답변
      </p>
      <p
        className={`text-sm text-fg-light leading-relaxed whitespace-pre-wrap ${
          isLong && !expanded ? "line-clamp-4" : ""
        }`}
      >
        {answer}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-[11px] font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          {expanded ? "접기 ↑" : "전체 보기 ↓"}
        </button>
      ) : null}
    </div>
  );
}
