import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client — server components, route handlers, server actions.
 *
 * Next 16: `cookies()`는 async. `setAll`은 server component에서 try/catch로
 * 감싸야 함 — Server Components는 응답 헤더를 못 만지기 때문(middleware가
 * 토큰 refresh 핸들링). Route handler·server action에서는 정상 동작.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components에서 호출된 경우 — middleware가 토큰 refresh를
            // 다음 요청에 처리하므로 무시 가능.
          }
        },
      },
    },
  );
}
