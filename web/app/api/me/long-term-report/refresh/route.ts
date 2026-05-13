import { createSupabaseServerClient } from "@/lib/supabase/server";
import { synthesizeAndSaveLongTermReport } from "@/lib/me/long-term-synthesis";
import type { BaselineShape } from "@/lib/me/baseline-shape";

export const runtime = "nodejs";
// LLM 합성이 ~10~30s 걸릴 수 있어 Vercel hobby 기본 10s 우회
export const maxDuration = 60;

/**
 * POST /api/me/long-term-report/refresh
 *
 * 누적 답변을 다시 반영해 LongTermReport를 새로 합성·저장.
 * 클라이언트는 응답 받으면 router.refresh()로 서버 컴포넌트 재실행 → 새 캐시 hit.
 *
 * 멱등 — 짧은 시간에 두 번 호출되면 같은 답변 풀로 두 번 합성 (마지막 결과 저장).
 * baseline이 없으면 400.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: baselineRow } = await supabase
    .from("baseline_report")
    .select("report")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!baselineRow) {
    return Response.json(
      { error: "baseline이 아직 없어요. 셀프인터뷰 또는 Import를 먼저 진행해주세요." },
      { status: 400 },
    );
  }

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

  const baselineShape = baselineRow.report as BaselineShape;
  const result = await synthesizeAndSaveLongTermReport({
    supabase,
    userId: user.id,
    userName: displayName,
    baselineShape,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
