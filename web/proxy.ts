import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy — 세션 refresh + /me/* 보호.
 *
 * Next 16에서 `middleware` 파일·함수가 `proxy`로 이름 변경됨. 동작은 동일.
 * 모든 요청에서 Supabase 세션을 검증·갱신하고, /me/* 진입은 로그인 강제.
 * /demo·/auth 등 공개 경로는 그대로 통과.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 방어: Supabase env가 없으면 (예: prod 환경변수 누락 직후) Supabase
  // 클라이언트 생성 자체가 throw → 500. 이 경우 공개 경로는 그대로 통과시키고,
  // /me/*만 / 로 redirect해서 시연이 끊기지 않게 한다.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    if (pathname.startsWith("/me")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // /me/* 보호 — 비로그인이면 /auth/sign-in으로
  if (pathname.startsWith("/me") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 이미 로그인한 사용자가 /auth/sign-in·/auth/sign-up 접근 시 /me로
  if (
    user &&
    (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/me";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 자원·이미지·폰트 제외하고 모든 경로 매칭
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)$).*)",
  ],
};
