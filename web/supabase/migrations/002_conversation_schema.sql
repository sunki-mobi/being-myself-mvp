-- ========================================================================
-- 002_conversation_schema.sql
-- Phase 2: 답변 누적 — conversation, qa_pair, answer_card
--
-- - conversation: 한 번의 셀프인터뷰 세션 (client-generated UUID). 새 세션을
--   "시작"하는 시점에 생성됨.
-- - qa_pair: 질문 + 사용자 답변 + (답변 후) AI reaction. 답변이 완료된 turn만
--   기록 (in-progress는 LocalStorage가 보유).
-- - answer_card: LLM이 정리한 답변 카드 (제목·카테고리·본문) 캐시.
--
-- 전략: LocalStorage는 in-session 상태 유지 (live UX), DB는 누적 source of
-- truth. Phase 3·4 합성에서 DB qa_pair를 읽음.
-- ========================================================================

-- 1) conversation ----------------------------------------------------------
create table public.conversation (
  id           uuid primary key,  -- client-generated UUID (crypto.randomUUID)
  user_id      uuid not null references auth.users(id) on delete cascade,
  track        text not null default 'me' check (track in ('me', 'baseline')),
  is_complete  boolean not null default false,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index conversation_user_started_idx
  on public.conversation(user_id, started_at desc);

alter table public.conversation enable row level security;

create policy "conversation_select_own"
  on public.conversation for select
  using (auth.uid() = user_id);

create policy "conversation_insert_own"
  on public.conversation for insert
  with check (auth.uid() = user_id);

create policy "conversation_update_own"
  on public.conversation for update
  using (auth.uid() = user_id);

create trigger conversation_touch_updated_at
  before update on public.conversation
  for each row execute function public.touch_updated_at();

-- 2) qa_pair ---------------------------------------------------------------
create table public.qa_pair (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_index  integer not null,
  question_text   text not null,
  reaction_text   text,
  answer_text     text not null,
  created_at      timestamptz not null default now()
);

create unique index qa_pair_conv_question_unique
  on public.qa_pair(conversation_id, question_index);

create index qa_pair_user_created_idx
  on public.qa_pair(user_id, created_at desc);

alter table public.qa_pair enable row level security;

create policy "qa_pair_select_own"
  on public.qa_pair for select
  using (auth.uid() = user_id);

create policy "qa_pair_insert_own"
  on public.qa_pair for insert
  with check (auth.uid() = user_id);

create policy "qa_pair_update_own"
  on public.qa_pair for update
  using (auth.uid() = user_id);

-- 3) answer_card -----------------------------------------------------------
create table public.answer_card (
  qa_pair_id   uuid primary key references public.qa_pair(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  category     text,
  body         text,
  generated_at timestamptz not null default now()
);

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
