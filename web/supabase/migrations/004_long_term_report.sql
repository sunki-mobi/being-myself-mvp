-- ========================================================================
-- 004_long_term_report.sql
-- Phase 4: 4단계(현상·본질·가치·존재) 누적 보고서
--
-- 사용자가 baseline 만든 직후부터 항상 존재하는 LongTermReport. 답변이
-- 쌓일수록 LLM이 재합성해 내용이 진화. 임계점 기다리지 않음 — Day 1에도
-- baseline 기반으로 best-effort 합성.
--
-- 한 사용자당 1개 row (user_id unique).
-- ========================================================================

create table public.long_term_report (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  shape             jsonb not null,                -- LongTermShape JSON
  based_on_qa_count integer not null default 0,    -- 합성 시 사용된 qa_pair 수 — staleness 비교용
  generated_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.long_term_report enable row level security;

create policy "long_term_report_select_own"
  on public.long_term_report for select
  using (auth.uid() = user_id);

create policy "long_term_report_insert_own"
  on public.long_term_report for insert
  with check (auth.uid() = user_id);

create policy "long_term_report_update_own"
  on public.long_term_report for update
  using (auth.uid() = user_id);

create trigger long_term_report_touch_updated_at
  before update on public.long_term_report
  for each row execute function public.touch_updated_at();
