-- ========================================================================
-- 007_usage_metrics_security.sql
-- somyeong_usage_metrics view 보안 강화
--
-- 문제:
--   006에서 만든 somyeong_usage_metrics view가 Supabase Table Editor에
--   "UNRESTRICTED" 빨간 배지로 표시됨. Postgres view는 RLS를 직접 가질 수
--   없고, 기본값 `security_invoker = off`이면 view 소유자(postgres) 권한
--   으로 실행되므로 underlying table(somyeong_entries)의 RLS가 우회됨.
--   → 인증된 사용자가 이 view를 조회하면 다른 사용자의 user_id +
--      entries_created 카운트가 노출될 수 있음.
--
-- 해결:
--   1) `security_invoker = on` → view 호출자의 권한으로 실행 →
--      somyeong_entries RLS(본인 row만)가 그대로 적용됨.
--   2) anon, authenticated role에서 SELECT 권한 REVOKE → 클라이언트 SDK
--      에서는 아예 노출 안 됨. 운영자 모니터링은 service_role(서버 키)로만.
--
-- 이 두 가지가 모두 들어가면 Table Editor 빨간 배지가 사라짐.
-- ========================================================================

alter view public.somyeong_usage_metrics set (security_invoker = on);

revoke select on public.somyeong_usage_metrics from anon, authenticated;
