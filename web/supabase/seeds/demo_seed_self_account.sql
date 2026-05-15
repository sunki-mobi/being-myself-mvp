-- ========================================================================
-- demo_seed_self_account.sql
-- 본인 계정 시연용 시드 — baseline 비우고 + 답변·일기 누적 시드
--
-- 시연 흐름:
--   1) 시연 전: 본 파일 paste → Run
--      → 본인 baseline_report 자동 backup → DELETE
--      → conversation/qa_pair 3일치 + somyeong_entries 3일치 시드
--   2) 시연 중:
--      a. /me 진입 → BaselineSelectClient(baseline 없음 화면) 시연
--      b. 셀프인터뷰 시작 → 빠르게 1~2개 답변 후 완료 (또는 phase 전환 시
--         별도로 fake baseline 시드 — 추후 옵션)
--      c. baseline 생성 후 /me/reports·/me/report·/me/diary 시연
--         (시드된 답변·일기 보임)
--   3) 시연 후: 파일 하단 cleanup 블록 주석 풀어서 Run
--      → 시연 중 생성된 baseline DELETE
--      → 시드 데이터 DELETE
--      → backup에서 본인 baseline 복원
--
-- 안전성:
--   - 본인 baseline은 _demo_baseline_backup 테이블에 보존
--   - cleanup 안 돌리면 backup에 계속 남아 있음 — 데이터 손실 0
--   - 이메일 본인 것 확인 ('edu@mobinity.io' default)
-- ========================================================================

-- backup table — 없으면 만들기
create table if not exists public._demo_baseline_backup (
  user_id      uuid primary key,
  report       jsonb,
  generated_at timestamptz,
  backed_up_at timestamptz not null default now()
);

do $$
declare
  uid uuid := (
    select id from auth.users where email = 'edu@mobinity.io' limit 1
  );
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
begin
  if uid is null then
    raise exception 'auth.users에 해당 email이 없어요. 이메일을 확인하세요.';
  end if;

  -- ====== baseline backup + DELETE ======
  insert into public._demo_baseline_backup (user_id, report, generated_at)
  select user_id, report, generated_at
    from public.baseline_report
   where user_id = uid
  on conflict (user_id) do update
    set report       = excluded.report,
        generated_at = excluded.generated_at,
        backed_up_at = now();

  delete from public.baseline_report where user_id = uid;
  -- 진행 중 셀프인터뷰 상태도 클리어 (시연 시 새로 시작)
  delete from public.baseline_interview_progress where user_id = uid;

  -- ====== conversation 3개 (3일치) ======
  insert into public.conversation (id, user_id, track, is_complete, started_at, completed_at)
  values
    (c1, uid, 'me', true,
     '2026-05-12 22:00:00+09'::timestamptz,
     '2026-05-12 22:10:00+09'::timestamptz),
    (c2, uid, 'me', true,
     '2026-05-13 22:00:00+09'::timestamptz,
     '2026-05-13 22:10:00+09'::timestamptz),
    (c3, uid, 'me', true,
     '2026-05-14 22:00:00+09'::timestamptz,
     '2026-05-14 22:10:00+09'::timestamptz);

  -- ====== qa_pair 6개 (날짜별 2개씩) ======
  insert into public.qa_pair
    (conversation_id, user_id, question_index, question_text,
     reaction_text, answer_text, created_at)
  values
    -- 5/12
    (c1, uid, 0,
     '오늘 마음속에 가장 오래 남은 한 가지 순간이 있다면 무엇이었나요?',
     '"빛나더라고요"라는 표현이 인상 깊어요.',
     '팀원이 처음 PR을 머지하는 걸 옆에서 봤을 때예요. 표정이 진짜 빛나더라고요. 작은 일인데도 그 자리에 함께 있을 수 있어서 좋았어요.',
     '2026-05-12 22:03:00+09'::timestamptz),
    (c1, uid, 1,
     '그 ''함께 있을 수 있어서 좋았다''는 감각이 어떻게 느껴졌어요?',
     '오늘 나눈 이야기, 보고서에 잘 담아둘게요.',
     '코드 자체보다 그 사람이 처음 부딪히는 자리에 있을 수 있다는 게 진짜였어요. 도움이 되는 건 결과보다 옆에 있는 거더라고요.',
     '2026-05-12 22:09:00+09'::timestamptz),

    -- 5/13
    (c2, uid, 0,
     '오늘 하루 중, ''아 이건 정말 나답다'' 싶었던 순간이 있다면 어떤 거였어요?',
     '"한 명씩 따로"라는 그 결이 인상적이네요.',
     '회의에서 다들 의견이 갈렸을 때, 한 명씩 따로 만나서 들었던 순간. 시간이 오래 걸렸지만 그게 맞다고 느꼈어요.',
     '2026-05-13 22:01:00+09'::timestamptz),
    (c2, uid, 1,
     '그 ''맞다고 느꼈다''는 감각이 어떤 모양이었어요?',
     '오늘 나눈 이야기, 보고서에 잘 담아둘게요.',
     '바쁘게 결론 내는 것보다 한 사람씩 듣는 시간이 결국 더 빠른 길이라는 확신이요. 그 확신만큼은 잘 안 흔들리더라고요.',
     '2026-05-13 22:08:00+09'::timestamptz),

    -- 5/14
    (c3, uid, 0,
     '오늘 마음을 끌어당긴 순간이 있다면 무엇이었나요?',
     '"먼저 이야기해줬을 때"라는 그 한 조각이 따뜻하네요.',
     '신입이 ''저도 코칭 한번 받아보고 싶어요''라고 먼저 이야기해줬을 때요. 부담 안 줬는데도 알아서 와줬어요.',
     '2026-05-14 22:00:00+09'::timestamptz),
    (c3, uid, 1,
     '그 ''먼저 와줬다''는 감각이 오늘 어떤 결로 남았어요?',
     '오늘 나눈 이야기, 보고서에 잘 담아둘게요.',
     '내가 자리만 잘 깔아두면 사람들이 알아서 들어온다는 것. 무리하게 끌어당기지 않아도 된다는 것이요.',
     '2026-05-14 22:07:00+09'::timestamptz);

  -- ====== somyeong_entries 3개 (3일치) ======
  insert into public.somyeong_entries
    (user_id, entry_date, evening_report_text, contribution_flow,
     ai_question, ai_question_source, answer, free_note, created_at)
  values
    (uid, '2026-05-12',
     E'09:00-10:30 팀 스탠드업\n10:30-12:00 OKR 검토 (KR2)\n13:00-15:00 신입 1on1\n15:00-17:00 PR 리뷰 + 페어 프로그래밍\n17:00-18:00 미팅 정리',
     '{}'::jsonb,
     '오늘 <strong>신입 1on1</strong> 시간이 길었네요. 그 자리에서 <em>가장 살아있게 느껴진 한 조각</em>은 어디였어요?',
     'OKR 밖에서 닿은 일에서',
     '신입이 본인 코드에 대해 진지하게 묻는 그 5분이었어요. 답을 가르치는 것보다 같이 보는 시간이라는 게 느껴졌어요.',
     '오늘은 평소보다 사람과 사람 사이에 머무는 시간이 길었다. 그 시간이 오히려 일을 더 잘 흘러가게 한다는 걸 다시 느낀다.',
     '2026-05-12 22:30:00+09'::timestamptz),

    (uid, '2026-05-13',
     E'09:00-11:00 디자인 리뷰 미팅\n11:00-12:30 회의 후 1on1 3건 연속\n14:00-16:00 OKR KR1 작업\n16:00-18:00 슬랙 정리 + 답신',
     '{}'::jsonb,
     '오늘 <strong>회의 후 1on1 3건</strong>은 어떤 매듭을 풀어준 시간이었어요?',
     '오늘 전체에서',
     '회의에서 못 다 한 이야기가 1on1에서 풀렸어요. 정해진 안건이 아닌 ''정말 어땠어요?'' 한 마디부터 시작하는 시간.',
     '회의에서 갈라진 마음이 1on1에서 다시 모이는 걸 봤다. 결정은 회의에서 나지만 신뢰는 1on1에서 자란다.',
     '2026-05-13 22:35:00+09'::timestamptz),

    (uid, '2026-05-14',
     E'09:30-10:00 모닝 체크인\n10:00-12:00 분기 OKR 점검\n13:00-14:30 신입 코칭 (정기)\n14:30-17:00 제품 기획 미팅\n17:00-18:30 답신 + 회고',
     '{}'::jsonb,
     '<strong>신입 코칭</strong> 자리에서 오늘 <em>새로 보인 한 조각</em>이 있었나요?',
     '내 OKR에 닿은 일에서',
     '신입이 본인 약점을 먼저 말하기 시작한 게 보였어요. 처음엔 잘하는 것만 말했는데 오늘은 안 풀리는 것도 같이 이야기했어요.',
     null,
     '2026-05-14 22:40:00+09'::timestamptz)
  on conflict (user_id, entry_date) do nothing;

  raise notice '시드 완료: baseline backup + DELETE, conversation 3개, qa_pair 6개, somyeong_entries 최대 3개. 시연 후 cleanup 블록 실행하세요.';
end $$;


-- ========================================================================
-- CLEANUP — 시연 후 (주석 풀어서 실행)
-- ========================================================================
-- do $$
-- declare
--   uid uuid := (select id from auth.users where email = 'edu@mobinity.io' limit 1);
-- begin
--   -- 1. 시드 데이터 삭제
--   delete from public.conversation
--    where user_id = uid
--      and started_at >= '2026-05-12 00:00:00+09'::timestamptz
--      and started_at <  '2026-05-15 00:00:00+09'::timestamptz;
--   -- conversation ON DELETE CASCADE → qa_pair 자동 삭제
--   -- qa_pair ON DELETE CASCADE → answer_card 자동 삭제
--   delete from public.somyeong_entries
--    where user_id = uid
--      and entry_date in ('2026-05-12', '2026-05-13', '2026-05-14');
--   delete from public.daily_digest
--    where user_id = uid
--      and digest_date in ('2026-05-12', '2026-05-13', '2026-05-14');
--
--   -- 2. 시연 중 생성된 baseline_report 삭제
--   delete from public.baseline_report where user_id = uid;
--   delete from public.baseline_interview_progress where user_id = uid;
--
--   -- 3. backup에서 본인 baseline 복원
--   insert into public.baseline_report (user_id, report, generated_at)
--   select user_id, report, generated_at
--     from public._demo_baseline_backup
--    where user_id = uid;
--
--   -- 4. backup row 정리
--   delete from public._demo_baseline_backup where user_id = uid;
--
--   raise notice 'cleanup 완료: 시드 데이터 삭제 + 본인 baseline 복원';
-- end $$;
