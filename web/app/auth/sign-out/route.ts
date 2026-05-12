import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeOrigin } from "@/lib/supabase/redirect";

/**
 * /auth/sign-out — POST으로만 호출. 서버에서 세션 종료 후 / 로 redirect.
 *
 * GET을 따로 두지 않는 이유: 링크 prefetch나 사이드 이펙트 없는 GET을
 * 기대하는 클라이언트에서 우발적 로그아웃 방지.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${safeOrigin(request)}/`, { status: 303 });
}
