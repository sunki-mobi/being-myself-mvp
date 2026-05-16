-- ========================================================================
-- demo_clear_today.sql
-- 시연 직전 — 본인 계정의 "오늘 데이터" reset
--
-- 지우는 것 (KST 기준 오늘):
--   - conversation + qa_pair + answer_card (cascade)
--   - somyeong_entries (entry_date = 오늘)
--   - daily_digest (digest_date = 오늘)
--
-- 보존 (안 건드림):
--   - baseline_report (시연 흐름의 셀프인터뷰 결과)
--   - 어제 이전 시드 데이터 (5/12·5/13·5/14)
--
-- 사용:
--   1. Supabase SQL Editor에서 paste → Run
--   2. 매 시연 직전마다 반복 사용 가능 (KST today 자동 계산)
-- ========================================================================

do $$
declare
  uid uuid := (
    select id from auth.users where email = 'edu@mobinity.io' limit 1
  );
  today_kst date := (now() at time zone 'Asia/Seoul')::date;
  deleted_conv int;
  deleted_diary int;
  deleted_digest int;
begin
  if uid is null then
    raise exception 'auth.users에 해당 email이 없어요. 이메일을 확인하세요.';
  end if;

  -- 1. 오늘(KST) 시작된 conversation 삭제 → qa_pair·answer_card cascade
  with del as (
    delete from public.conversation
     where user_id = uid
       and (started_at at time zone 'Asia/Seoul')::date = today_kst
    returning 1
  )
  select count(*) into deleted_conv from del;

  -- 2. 오늘 일기 삭제
  with del as (
    delete from public.somyeong_entries
     where user_id = uid
       and entry_date = today_kst
    returning 1
  )
  select count(*) into deleted_diary from del;

  -- 3. 오늘 digest 캐시 삭제
  with del as (
    delete from public.daily_digest
     where user_id = uid
       and digest_date = today_kst
    returning 1
  )
  select count(*) into deleted_digest from del;

  raise notice 'KST today (%) reset 완료: conversation %, 일기 %, digest %',
    today_kst, deleted_conv, deleted_diary, deleted_digest;
end $$;
