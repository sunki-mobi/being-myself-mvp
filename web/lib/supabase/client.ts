import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * 클라이언트 컴포넌트("use client")에서 호출. 매 컴포넌트마다 새로 생성하지
 * 말고 모듈 레벨에서 한 번 만들어 재사용. `@supabase/ssr`이 내부적으로
 * cookies + localStorage 핸들링을 함.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
