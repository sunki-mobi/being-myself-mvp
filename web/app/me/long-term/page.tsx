import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  shapeToLongTermReport,
  synthesizeAndSaveLongTermReport,
  type LongTermShape,
} from "@/lib/me/long-term-synthesis";
import type { BaselineShape } from "@/lib/me/baseline-shape";

/**
 * /me/long-term — 4단계(현상·본질·가치·존재) 누적 보고서.
 *
 * Lazy 합성: long_term_report row 없으면 inline으로 LLM 합성·저장 후 렌더.
 * 첫 방문 시 ~10~30초 대기. 이후 캐시 hit.
 *
 * Phase 4b에서 staleness 체크(누적 답변 늘었으면 재합성) 추가 예정.
 */

// LLM 합성 + DB 저장이 Vercel hobby 기본 10s를 넘을 수 있어 60s까지 허용.
export const maxDuration = 60;

import { LongTermReportClient } from "./LongTermReportClient";

/** 누적 답변 N개 이상 추가되면 stale로 표시 — 사용자에게 재합성 권유. */
const STALE_THRESHOLD = 3;

export default async function MeLongTermPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/long-term");

  // baseline 없으면 /me로 (BaselineSelectClient 화면을 보게)
  const { data: baselineRow } = await supabase
    .from("baseline_report")
    .select("report, generated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!baselineRow) redirect("/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "친구";

  // 누적 답변 수 (현재 시점)
  const { count: totalAnswers } = await supabase
    .from("qa_pair")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // daySpan = baseline.generated_at부터 오늘까지 일수 (최소 1)
  const baselineCreatedAt = baselineRow.generated_at as string;
  const daysFromBaseline = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(baselineCreatedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );

  // 캐시된 long_term_report
  const { data: cachedRow } = await supabase
    .from("long_term_report")
    .select("shape, based_on_qa_count")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentTotal = totalAnswers ?? 0;

  if (cachedRow) {
    const basedOn = cachedRow.based_on_qa_count ?? 0;
    const pendingAnswers = Math.max(0, currentTotal - basedOn);
    const report = shapeToLongTermReport(cachedRow.shape as LongTermShape, {
      userName: displayName,
      totalAnswers: currentTotal,
      daySpan: daysFromBaseline,
    });
    return (
      <LongTermReportClient
        report={report}
        pendingAnswers={pendingAnswers}
        isStale={pendingAnswers >= STALE_THRESHOLD}
      />
    );
  }

  // 캐시 miss → inline 합성
  const baselineShape = baselineRow.report as BaselineShape;
  const result = await synthesizeAndSaveLongTermReport({
    supabase,
    userId: user.id,
    userName: displayName,
    baselineShape,
  });

  if (!result.ok) {
    return <LongTermErrorView error={result.error} />;
  }

  return (
    <LongTermReportClient
      report={result.report}
      pendingAnswers={0}
      isStale={false}
    />
  );
}

function LongTermErrorView({ error }: { error: string }) {
  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-6 animate-fade-up">
        <div className="text-5xl">😢</div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          보고서를 만들지 못했어요
        </h1>
        <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px] max-w-xs">
          {error}
        </p>
        <a
          href="/me"
          className="mt-2 px-5 py-2.5 rounded-full bg-surface-card text-fg-light text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          ← 돌아가기
        </a>
      </div>
    </main>
  );
}
