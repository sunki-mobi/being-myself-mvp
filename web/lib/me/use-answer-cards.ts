"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerCard } from "@/components/TodayAnswerCard";

/**
 * 오늘 답변 페어 배열을 받아 answer-card LLM 결과를 백그라운드로 fetch.
 * /me·/demo 두 트랙 모두 답변 정리 카드를 같은 방식으로 채움.
 *
 * key는 `question::answer` 합성. 같은 pair는 한 번만 fetch (fetchedRef).
 */
export function useAnswerCards(
  pairs: { question: string; answer: string; key: string }[],
  hydrated: boolean,
) {
  const [cards, setCards] = useState<Record<string, AnswerCard>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hydrated || pairs.length === 0) return;
    for (const pair of pairs) {
      if (fetchedRef.current.has(pair.key)) continue;
      fetchedRef.current.add(pair.key);
      setLoading((prev) => ({ ...prev, [pair.key]: true }));
      fetch("/api/me/answer-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: pair.question,
          answer: pair.answer,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`answer-card ${res.status}`);
          return res.json();
        })
        .then((data: AnswerCard) => {
          setCards((prev) => ({ ...prev, [pair.key]: data }));
        })
        .catch((err) => {
          console.error("[answer-card]", err);
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, [pair.key]: false }));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pairs.length]);

  return { cards, loading };
}
