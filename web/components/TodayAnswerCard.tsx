"use client";

export type AnswerCard = {
  subtopics: { title: string; bullets: string[] }[];
  summary: string;
  keywords: string[];
};

/**
 * 오늘 답변 한 개를 잡지 톤으로 정리해주는 카드. answer-card LLM의 출력
 * (subtopics + summary + keywords)을 시각화. /me/report·/demo/report 둘 다 사용.
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
      className="p-5 rounded-3xl"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--grad-stop-1) 0%, var(--grad-stop-2) 50%, var(--grad-stop-3) 100%)",
      }}
    >
      <p className="text-xs font-semibold text-fg-light mb-1">Q{index}</p>
      <h3 className="text-sm font-bold text-fg-light mb-3 leading-snug">
        {pair.question}
      </h3>

      {card ? (
        <div className="bg-white/80 rounded-2xl p-4 flex flex-col gap-3">
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
        <div className="bg-white/80 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-brand-500/60 rounded-full animate-bounce [animation-delay:0.3s]" />
            </span>
            <p className="text-xs text-fg-light-soft">잡지 톤으로 정리 중</p>
          </div>
          <p className="text-sm text-fg-light/70 leading-relaxed whitespace-pre-wrap">
            {pair.answer}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 rounded-2xl p-4">
          <p className="text-sm text-fg-light leading-relaxed whitespace-pre-wrap">
            {pair.answer}
          </p>
        </div>
      )}
    </article>
  );
}
