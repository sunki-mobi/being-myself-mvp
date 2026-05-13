-- ========================================================================
-- 005_answer_card_jsonb.sql
-- Phase (b): 답변 카드 DB 캐시 wire-up
--
-- 002에서 만든 answer_card 스키마(title·category·body)가 실제 LLM 출력
-- (subtopics·summary·keywords)과 안 맞아서, 단일 `card jsonb` 컬럼으로 재정비.
-- 테이블이 비어있어서 drop·recreate가 데이터 손실 없음.
-- ========================================================================

drop table if exists public.answer_card cascade;

create table public.answer_card (
  qa_pair_id   uuid primary key references public.qa_pair(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  card         jsonb not null,
  generated_at timestamptz not null default now()
);

create index answer_card_user_idx
  on public.answer_card(user_id, generated_at desc);

alter table public.answer_card enable row level security;

create policy "answer_card_select_own"
  on public.answer_card for select
  using (auth.uid() = user_id);

create policy "answer_card_insert_own"
  on public.answer_card for insert
  with check (auth.uid() = user_id);

create policy "answer_card_update_own"
  on public.answer_card for update
  using (auth.uid() = user_id);
