import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/me/settings/goal
 *
 * "내 목표"(OKR/KPI/분기 목표 등 자유 형식) upsert.
 *
 * Input:  { period: string?, body: string }
 *   - period: 기간 라벨 (선택). 빈 문자열이면 "default"로 fallback.
 *   - body: 자유 텍스트 본문.
 *
 * DB: somyeong_user_okr (테이블은 OKR 가정으로 만들었지만 generic하게 활용)
 *   - quarter: period || "default"
 *   - okr_data: { raw_text: body }
 *   - mission_text, weekly_goal: null (V1에선 단일 raw_text만)
 *
 * 사용자는 작성 안 해도 됨 — 일기 합성에서는 raw_text 있을 때만 컨텍스트 주입.
 */

const inputSchema = z.object({
  period: z.string().max(60).optional().default(""),
  body: z.string().max(10000),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let parsed: z.infer<typeof inputSchema>;
  try {
    const raw = await request.json();
    parsed = inputSchema.parse(raw);
  } catch (err) {
    return Response.json(
      { error: "입력 형식이 올바르지 않아요.", detail: String(err) },
      { status: 400 },
    );
  }

  const quarter = parsed.period.trim() || "default";
  const body = parsed.body.trim();

  // body 비어있으면 row 자체 삭제 (목표 등록 해제)
  if (!body) {
    const { error: delErr } = await supabase
      .from("somyeong_user_okr")
      .delete()
      .eq("user_id", user.id);
    if (delErr) {
      console.error("[/api/me/settings/goal] delete error", delErr);
      return Response.json(
        { error: "저장 중 문제가 생겼어요.", detail: delErr.message },
        { status: 500 },
      );
    }
    return Response.json({ ok: true, cleared: true });
  }

  // 본인의 기존 row 모두 정리 후 새로 한 row 저장 (V1은 단일 row 흐름)
  const { error: clearErr } = await supabase
    .from("somyeong_user_okr")
    .delete()
    .eq("user_id", user.id);
  if (clearErr) {
    console.error("[/api/me/settings/goal] clear error", clearErr);
    return Response.json(
      { error: "저장 중 문제가 생겼어요.", detail: clearErr.message },
      { status: 500 },
    );
  }

  const { error: insErr } = await supabase.from("somyeong_user_okr").insert({
    user_id: user.id,
    quarter,
    mission_text: null,
    weekly_goal: null,
    okr_data: { raw_text: body },
  });
  if (insErr) {
    console.error("[/api/me/settings/goal] insert error", insErr);
    return Response.json(
      { error: "저장 중 문제가 생겼어요.", detail: insErr.message },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
