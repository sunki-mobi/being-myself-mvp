import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware용 Supabase 클라이언트.
 *
 * 매 요청마다 새 인스턴스 생성. `getUser()`로 세션 검증·refresh 트리거. 이
 * 함수의 응답(`supabaseResponse`)을 그대로 미들웨어에서 반환하거나, 추가
 * 헤더·redirect를 얹어 반환.
 *
 * 절대 `getSession()` 사용 X — 쿠키 그대로 신뢰하기 때문. `getUser()`는
 * Supabase 서버에 검증을 보내므로 안전.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, supabaseResponse, user };
}
