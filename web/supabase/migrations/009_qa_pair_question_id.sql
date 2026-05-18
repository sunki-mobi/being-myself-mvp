-- ========================================================================
-- 009_qa_pair_question_id.sql
-- Q2 큐레이션 풀(lib/me/question-pool.ts) 영구 중복 차단용.
--
-- 사용자가 받은 질문 id(예: "Q017")를 qa_pair row에 저장. Q2 생성 시
-- server가 본인의 누적 question_id list를 조회해 풀에서 제외 → LLM에는
-- 후보 5~10개만 전달.
--
-- nullable: Q1은 풀이 아닌 LLM 자유 생성(QueSCo 6 유형 기반)이라 NULL.
-- 기존 row(질문 id 없던 시절)도 NULL로 보존.
-- ========================================================================

alter table public.qa_pair
  add column if not exists question_id text;

create index if not exists qa_pair_user_question_id_idx
  on public.qa_pair(user_id, question_id)
  where question_id is not null;
