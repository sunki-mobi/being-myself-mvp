import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeOrigin } from "@/lib/supabase/redirect";

/**
 * /auth/callback — Supabase 이메일 인증·OAuth 콜백.
 *
 * Confirm email ON일 때 메일 링크 → 이 라우트로 진입. `code`를 세션으로 교환.
 * `next` 파라미터로 이동, 없으면 /me로.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";
  const origin = safeOrigin(request);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
