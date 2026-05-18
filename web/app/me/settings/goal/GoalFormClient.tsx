"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * /me/settings/goal form — "내 목표" 등록·수정.
 *
 * V1: period (선택) + body (자유 textarea). 의무 아님 — 작성 안 해도 일기
 * 동작. 작성하면 일기 합성 시 prompt 컨텍스트로 주입.
 *
 * 저장 → POST /api/me/settings/goal → somyeong_user_okr upsert.
 */
export function GoalFormClient({
  initialPeriod,
  initialBody,
}: {
  initialPeriod: string;
  initialBody: string;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState(initialPeriod);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const hasChanges = period !== initialPeriod || body !== initialBody;

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/me/settings/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: period.trim(),
          body: body.trim(),
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? `저장 실패 (${res.status})`);
        setSaving(false);
        return;
      }
      setSavedAt(Date.now());
      setSaving(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <header className="px-6 pt-10 pb-2 animate-fade-up">
          <Link
            href="/me/settings"
            aria-label="설정으로"
            className="inline-flex w-9 h-9 -ml-2 items-center justify-center rounded-md text-fg-light hover:bg-surface-card transition-colors no-select"
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
          </Link>
          <p className="mt-5 text-xs font-medium text-fg-light-soft">
            # 비교 기준
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
            내 목표
          </h1>
          <p className="mt-3 text-sm text-fg-light-soft leading-relaxed">
            OKR · KPI · 분기 목표 · 미션 등 무엇이든 좋아요.
            <br />
            적어두면 일기 합성 시 오늘 한 일과 비교해드려요.
          </p>
        </header>

        <section className="flex-1 px-6 py-6 flex flex-col gap-5 animate-fade-up-delay-1">
          <div>
            <label
              htmlFor="period"
              className="block text-xs font-semibold text-fg-light mb-2"
            >
              기간 <span className="text-fg-light-muted font-normal">(선택)</span>
            </label>
            <input
              id="period"
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-Q2 · 이번 주 · 5월 · 등"
              className="w-full px-4 py-3 rounded-[12px] bg-surface-paper border border-border-line text-sm text-fg-light placeholder:text-fg-light-muted focus:outline-none focus:border-brand-400 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="body"
              className="block text-xs font-semibold text-fg-light mb-2"
            >
              목표 본문
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`예시\n사업부 미션: 1만명에게 소명대로 일하는 도구를 제공한다.\nKR1: 11명 사용자에게 첫 V1 오픈\nKR2: 일기 누적 30개 도달\n금주 목표: 디자인 폴리시 + 보안 fix`}
              rows={14}
              className="w-full px-4 py-3 rounded-[12px] bg-surface-paper border border-border-line text-sm text-fg-light leading-relaxed placeholder:text-fg-light-muted focus:outline-none focus:border-brand-400 transition-colors resize-y font-mono"
            />
            <p className="mt-2 text-[11px] text-fg-light-muted leading-relaxed">
              자유 형식이에요. AI가 그대로 읽고 일기와 비교합니다.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
              {error}
            </p>
          ) : null}

          {savedAt ? (
            <p className="text-xs font-semibold text-brand-700 bg-selected-bg px-3 py-2 rounded-[8px]">
              ✓ 저장했어요
            </p>
          ) : null}
        </section>

        <section className="px-6 pb-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "저장하고 있어요…" : hasChanges ? "저장하기" : "변경 사항 없음"}
          </button>
          <Link
            href="/me/settings"
            className="w-full px-6 py-3 rounded-full bg-transparent text-fg-light-soft text-sm font-medium hover:text-fg-light transition-colors text-center"
          >
            설정으로 돌아가기
          </Link>
        </section>
      </div>
    </main>
  );
}
