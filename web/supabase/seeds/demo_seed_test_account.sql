-- ========================================================================
-- demo_seed_test_account.sql
-- 테스트 계정 시드 — baseline + 5일치 답변·일기.
--
-- 본인 계정 시드(demo_seed_self_account.sql)와의 차이:
--   - baseline backup·복원 X (테스트 계정엔 보존할 데이터 없음)
--   - 페르소나 다름 — '교육·콘텐츠 기획자' 결로 본인(리더 코칭 결)과 비교용
--   - 5일치 (= Q2 풀에 question_id 5개 누적 → recency dedup 동작 확인 가능)
--
-- 사용법:
--   1) auth.users에 test 계정 가입돼 있어야 함 (Supabase Dashboard에서 미리 만들거나 앱에서 가입)
--   2) 아래 TEST_EMAIL 한 줄을 실제 테스트 계정 이메일로 바꾸고 Run
--   3) 시연·테스트 후 파일 하단 cleanup 블록 주석 풀어서 Run
-- ========================================================================

do $$
declare
  -- ★ 한 줄만 바꾸세요 — 실제 테스트 계정 이메일
  TEST_EMAIL constant text := 'test@mobinity.io';

  uid uuid := (select id from auth.users where email = TEST_EMAIL limit 1);
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  c4 uuid := gen_random_uuid();
  c5 uuid := gen_random_uuid();
begin
  if uid is null then
    raise exception 'auth.users에 % 가 없어요. 먼저 Supabase Dashboard 또는 앱에서 가입하세요.', TEST_EMAIL;
  end if;

  -- ====== baseline_report — 페르소나: 교육·콘텐츠 기획자 ======
  -- BaselineShape (web/lib/me/baseline-shape.ts) 규약 따름
  -- source는 'interview' / 'import' 중 하나 (migration 003 check 제약)
  insert into public.baseline_report (user_id, source, report, generated_at)
  values (
    uid,
    'interview',
    jsonb_build_object(
      'headline', '당신은 사람의 시작점을 잘 짚어주는 사람입니다.',
      'parts', jsonb_build_array(
        jsonb_build_object(
          'partTitle', '가치 있는 것',
          'items', jsonb_build_array(
            jsonb_build_object(
              'title', '누군가의 첫 발걸음을 함께 디딘 시간',
              'description', jsonb_build_array(
                '처음 도전하는 사람 옆에서 같이 부딪혀본 경험이 가장 오래 남아요.',
                '결과보다 ''같이 있어준 시간''이 마음에 더 깊게 박힙니다.'
              )
            ),
            jsonb_build_object(
              'title', '꾸준한 페이스를 지키는 일상',
              'description', jsonb_build_array(
                '몰아치는 것보다 매일 조금씩 쌓는 결을 더 신뢰합니다.'
              )
            )
          ),
          'insight', '큰 성과보다 작고 꾸준한 시작에 의미를 느끼는 분이세요.',
          'keywords', jsonb_build_array('첫걸음', '꾸준함', '함께')
        ),
        jsonb_build_object(
          'partTitle', '좋아하는 것',
          'items', jsonb_build_array(
            jsonb_build_object(
              'title', '복잡한 걸 한 장으로 정리하는 순간',
              'description', jsonb_build_array(
                '여러 갈래의 이야기를 한 장의 그림이나 한 문장으로 압축할 때 몰입돼요.'
              )
            ),
            jsonb_build_object(
              'title', '낯선 주제를 처음 들춰보는 시간',
              'description', jsonb_build_array(
                '익숙한 분야보다 처음 보는 영역에 더 호기심이 생깁니다.'
              )
            )
          ),
          'insight', '정리·압축·낯선 영역 탐색 — 머리를 ''쓰는'' 결을 좋아하세요.',
          'keywords', jsonb_build_array('정리', '압축', '탐색')
        ),
        jsonb_build_object(
          'partTitle', '잘하는 것',
          'items', jsonb_build_array(
            jsonb_build_object(
              'title', '어려운 개념을 쉬운 비유로 옮기기',
              'description', jsonb_build_array(
                '복잡한 걸 듣는 사람 눈높이에 맞춰 풀어주는 게 자연스러워요.'
              )
            ),
            jsonb_build_object(
              'title', '판이 흔들릴 때 차분히 페이스 잡기',
              'description', jsonb_build_array(
                '주변이 급해질수록 한 박자 늦춰서 흐름을 잡습니다.'
              )
            )
          ),
          'insight', '''번역''과 ''페이스 잡기'' — 사람들 사이의 속도 조율자세요.',
          'keywords', jsonb_build_array('번역', '비유', '페이스')
        )
      )
    ),
    '2026-05-10 21:00:00+09'::timestamptz
  )
  on conflict (user_id) do update
    set source       = excluded.source,
        report       = excluded.report,
        generated_at = excluded.generated_at;

  -- ====== conversation 5개 (5일치) ======
  insert into public.conversation (id, user_id, track, is_complete, started_at, completed_at)
  values
    (c1, uid, 'me', true,
     '2026-05-13 22:00:00+09'::timestamptz, '2026-05-13 22:08:00+09'::timestamptz),
    (c2, uid, 'me', true,
     '2026-05-14 22:00:00+09'::timestamptz, '2026-05-14 22:08:00+09'::timestamptz),
    (c3, uid, 'me', true,
     '2026-05-15 22:00:00+09'::timestamptz, '2026-05-15 22:08:00+09'::timestamptz),
    (c4, uid, 'me', true,
     '2026-05-16 22:00:00+09'::timestamptz, '2026-05-16 22:08:00+09'::timestamptz),
    (c5, uid, 'me', true,
     '2026-05-17 22:00:00+09'::timestamptz, '2026-05-17 22:08:00+09'::timestamptz);

  -- ====== qa_pair 10개 (날짜별 Q1·Q2) ======
  -- Q1은 LLM 자유 생성이라 question_id NULL
  -- Q2는 풀에서 선택된 거라 question_id 채움 (5개 — Q005, Q018, Q033, Q046, Q075)
  insert into public.qa_pair
    (conversation_id, user_id, question_index, question_text,
     reaction_text, answer_text, question_id, created_at)
  values
    -- 5/13
    (c1, uid, 0,
     '오늘 마음에 가장 오래 남은 한 순간이 있다면 무엇이었어요?',
     '''비유 하나로 풀렸다''는 그 결이 인상적이네요.',
     '회의에서 제품 설명이 안 풀리길래 ''이건 책 한 권의 목차 같은 거예요''라고 비유했더니 다들 끄덕끄덕했어요. 그 한 순간이 오래 남아요.',
     null,
     '2026-05-13 22:02:00+09'::timestamptz),
    (c1, uid, 1,
     '요즘 자꾸 눈이 가는 주제나 분야가 있나요?',
     '오늘 나눈 이야기, 잘 담아둘게요.',
     '학습 콘텐츠를 어떻게 ''짧게'' 압축하는지에 관심이 많이 가요. 길게 만드는 건 쉬운데 짧게 핵심만 남기는 건 어려워서요.',
     'Q005',
     '2026-05-13 22:07:00+09'::timestamptz),

    -- 5/14
    (c2, uid, 0,
     '어제의 ''짧게 압축''이라는 표현이 오늘 어떤 모양으로 이어졌어요?',
     '''한 문장으로''라는 그 결이 따뜻하네요.',
     '오늘 신규 강의 기획 회의에서 30분짜리를 한 문장으로 줄여보자고 했어요. 다들 처음엔 어려워했는데 결국 ''이 강의는 첫 5분이면 충분하다''로 끝났어요.',
     null,
     '2026-05-14 22:01:00+09'::timestamptz),
    (c2, uid, 1,
     '"나답지 않다"는 느낌이 드는 상황은 언제인가요?',
     '오늘 나눈 이야기, 잘 담아둘게요.',
     '결정을 빠르게 내려야 하는 자리에서요. 충분히 들춰보지 못한 채 결론을 내야 할 때 마음이 가장 불편해요.',
     'Q018',
     '2026-05-14 22:07:00+09'::timestamptz),

    -- 5/15
    (c3, uid, 0,
     '"나답지 않다"는 그 불편함 안에 어떤 바람이 있는 것 같아요?',
     '''조금만 더 들춰보고''라는 한 조각이 와닿아요.',
     '조금만 더 들춰보고 결정하고 싶다는 바람이요. 결국 빠른 답보다는 ''맞는 답''에 더 끌려요.',
     null,
     '2026-05-15 22:00:00+09'::timestamptz),
    (c3, uid, 1,
     '어떤 일을 마쳤을 때 뿌듯함보다 아쉬움이 남는 것이 있나요?',
     '오늘 나눈 이야기, 잘 담아둘게요.',
     '아이디어는 좋았는데 마지막에 시간 쫓겨서 대충 마무리한 콘텐츠요. 며칠 지나면 ''그때 한 번만 더 봤더라면'' 싶어요.',
     'Q033',
     '2026-05-15 22:06:00+09'::timestamptz),

    -- 5/16
    (c4, uid, 0,
     '''한 번만 더 봤더라면''이라는 그 결이 오늘은 어떻게 닿았어요?',
     '''여백 한 자리''라는 표현이 인상 깊네요.',
     '오늘은 일부러 캘린더에 ''여백 한 자리''를 비워뒀어요. 마무리할 시간을 따로 잡으니까 마음이 덜 쫓겼어요.',
     null,
     '2026-05-16 22:02:00+09'::timestamptz),
    (c4, uid, 1,
     '타인의 의견에도 흔들리지 않았던 결정이 있나요? 뭐가 그렇게 만들었나요?',
     '오늘 나눈 이야기, 잘 담아둘게요.',
     '강의 길이를 절반으로 줄이자고 우긴 결정이요. 처음엔 다들 반대했지만 ''꼭 필요한 사람한테는 짧을수록 닿는다''는 확신이 있었어요.',
     'Q046',
     '2026-05-16 22:07:00+09'::timestamptz),

    -- 5/17
    (c5, uid, 0,
     '''짧을수록 닿는다''는 그 확신, 오늘은 어떻게 살아 있었나요?',
     '''읽힌다''는 그 한 조각이 좋네요.',
     '발표 자료를 절반 분량으로 줄여서 공유했더니 ''읽힌다''는 피드백이 왔어요. 그 한 마디가 오늘 가장 좋았어요.',
     null,
     '2026-05-17 22:01:00+09'::timestamptz),
    (c5, uid, 1,
     '실패가 없다면 지금 당장 해보고 싶은 것이 있나요?',
     '오늘 나눈 이야기, 잘 담아둘게요.',
     '교육 콘텐츠를 책 한 권으로 묶어보는 거요. 강의로만 흩어져 있는 걸 한 권의 결로 정리하면 어떤 모양일까 늘 궁금했어요.',
     'Q075',
     '2026-05-17 22:07:00+09'::timestamptz);

  -- ====== somyeong_entries 5개 (5일치 일기) ======
  insert into public.somyeong_entries
    (user_id, entry_date, evening_report_text, contribution_flow,
     ai_question, ai_question_source, answer, free_note, created_at)
  values
    (uid, '2026-05-13',
     E'10:00-12:00 콘텐츠 기획\n13:00-15:00 제품 회의\n15:00-17:00 강의 시나리오 작성\n17:00-18:00 답신 정리',
     '{}'::jsonb,
     '오늘 <strong>제품 회의</strong>에서 <em>가장 살아있게 느껴진 한 조각</em>은 어디였어요?',
     '내 OKR에 닿은 일에서',
     '비유로 설명이 풀렸을 때요. 다들 ''아 그렇게 보면 되겠네''라고 말한 그 5초.',
     '복잡한 건 결국 비유 하나로 풀린다. 그 비유 하나를 찾는 시간이 진짜 일이다.',
     '2026-05-13 22:30:00+09'::timestamptz),

    (uid, '2026-05-14',
     E'09:30-11:00 신규 강의 회의\n11:30-13:00 콘텐츠 압축 작업\n14:00-16:30 디자인 검토\n16:30-18:00 마무리',
     '{}'::jsonb,
     '<strong>강의 압축</strong>이 오늘 어떤 결로 흘렀어요?',
     '오늘 전체에서',
     '30분짜리를 한 문장으로 줄여본 시도. 처음엔 무리한 요구처럼 보였는데 결국 ''핵심은 첫 5분''으로 모였어요.',
     '짧게 만드는 게 진짜 어려운 일이라는 걸 또 느낀다. 길게 쓰는 건 쉽다.',
     '2026-05-14 22:35:00+09'::timestamptz),

    (uid, '2026-05-15',
     E'10:00-12:00 콘텐츠 리뷰\n13:00-14:30 1on1\n14:30-17:00 다음 분기 기획\n17:00-18:00 회고',
     '{}'::jsonb,
     '오늘 <strong>1on1</strong>에서 새로 보인 한 조각이 있었나요?',
     '내 OKR 밖에서 닿은 일에서',
     '동료가 ''이 흐름이 안 잡혀요''라고 하는데, 들춰보니 결국 페이스 문제였어요. 그걸 알아채는 데 한 시간이 걸렸어요.',
     null,
     '2026-05-15 22:40:00+09'::timestamptz),

    (uid, '2026-05-16',
     E'09:00-10:00 모닝 정리 (여백 한 자리 설정)\n10:00-12:00 강의 리허설\n13:30-15:30 콘텐츠 마감\n15:30-17:00 답신',
     '{}'::jsonb,
     '<strong>여백 한 자리</strong>가 오늘 어떤 차이를 만들었어요?',
     '오늘 전체에서',
     '마감 시간이 다가와도 마음이 덜 흔들렸어요. 마무리할 시간이 있다는 걸 아는 것만으로 페이스가 잡혔어요.',
     '여유는 시간이 아니라 ''여유를 잡은 결정''에서 온다는 걸 오늘 다시 알았다.',
     '2026-05-16 22:45:00+09'::timestamptz),

    (uid, '2026-05-17',
     E'10:00-12:00 발표 자료 정리\n13:00-14:00 발표 공유\n14:00-16:00 피드백 정리\n16:00-18:00 다음 주 준비',
     '{}'::jsonb,
     '''읽힌다''는 피드백이 오늘 어떤 결로 닿았어요?',
     '오늘 전체에서',
     '절반으로 줄인 게 오히려 더 잘 닿았어요. ''필요한 사람한테는 짧을수록 닿는다''는 가설이 한 번 더 맞아 들었어요.',
     '확신은 한 번에 안 생긴다. 작은 증거가 여러 번 쌓이면서 자란다.',
     '2026-05-17 22:50:00+09'::timestamptz)
  on conflict (user_id, entry_date) do nothing;

  raise notice '시드 완료: baseline 1건, conversation 5건, qa_pair 10건 (Q2 question_id 5건), somyeong_entries 최대 5건.';
end $$;


-- ========================================================================
-- CLEANUP — 테스트 후 (주석 풀어서 실행)
-- ========================================================================
-- do $$
-- declare
--   TEST_EMAIL constant text := 'test@mobinity.io';
--   uid uuid := (select id from auth.users where email = TEST_EMAIL limit 1);
-- begin
--   if uid is null then
--     raise exception 'auth.users에 % 가 없어요.', TEST_EMAIL;
--   end if;
--
--   -- conversation ON DELETE CASCADE → qa_pair → answer_card 까지 자동 삭제
--   delete from public.conversation
--    where user_id = uid
--      and started_at >= '2026-05-13 00:00:00+09'::timestamptz
--      and started_at <  '2026-05-18 00:00:00+09'::timestamptz;
--
--   delete from public.somyeong_entries
--    where user_id = uid
--      and entry_date in ('2026-05-13','2026-05-14','2026-05-15','2026-05-16','2026-05-17');
--
--   delete from public.daily_digest
--    where user_id = uid
--      and digest_date in ('2026-05-13','2026-05-14','2026-05-15','2026-05-16','2026-05-17');
--
--   delete from public.baseline_report where user_id = uid;
--   delete from public.baseline_interview_progress where user_id = uid;
--
--   raise notice 'cleanup 완료';
-- end $$;
