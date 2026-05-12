-- ========================================================================
-- 003_baseline_report.sql
-- Phase 3: 사용자별 baseline 보고서 + 인터뷰 진행 상태
--
-- - baseline_report: 한 사용자당 1개의 baseline (UNIQUE on user_id). 인터뷰
--   완료 후 또는 import 후 LLM이 합성한 BaselineReport JSON 저장.
-- - baseline_interview_progress: 진행 중 답변을 question 단위로 즉시 저장 →
--   이탈해도 다음에 이어서 가능. baseline_report 합성 직전까지 source of truth.
-- ========================================================================

-- 1) baseline_report -------------------------------------------------------
create table public.baseline_report (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique not null references auth.users(id) on delete cascade,
  source        text not null check (source in ('interview', 'import')),
  report        jsonb not null,  -- BaselineReport 전체 (Part·question·item·insight)
  version       integer not null default 1,
  generated_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index baseline_report_user_idx
  on public.baseline_report(user_id);

alter table public.baseline_report enable row level security;

create policy "baseline_report_select_own"
  on public.baseline_report for select
  using (auth.uid() = user_id);

create policy "baseline_report_insert_own"
  on public.baseline_report for insert
  with check (auth.uid() = user_id);

create policy "baseline_report_update_own"
  on public.baseline_report for update
  using (auth.uid() = user_id);

create trigger baseline_report_touch_updated_at
  before update on public.baseline_report
  for each row execute function public.touch_updated_at();

-- 2) baseline_interview_progress -------------------------------------------
-- 한 사용자당 최대 1개의 in-progress 인터뷰. 완료 시 baseline_report로 합성되고
-- 이 row는 그대로 두거나 archived=true 마킹.
create table public.baseline_interview_progress (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  -- 진행한 step 인덱스 (0 = Q1 객관식, 1 = Q1-1/Q1-2 음성, ... 5 = Q3-1/Q3-2 음성)
  current_step  integer not null default 0,
  -- 객관식 선택 + 음성 답변을 단순 JSON으로 누적. 합성 시 LLM에 통째로 전달.
  -- 예: { "q1_choice": "알고있어요", "q1_answer": "...", "q2_choice": "잘모르겠어요", "q2_answer": "...", ... }
  answers       jsonb not null default '{}'::jsonb,
  archived      boolean not null default false,
  started_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.baseline_interview_progress enable row level security;

create policy "baseline_progress_select_own"
  on public.baseline_interview_progress for select
  using (auth.uid() = user_id);

create policy "baseline_progress_insert_own"
  on public.baseline_interview_progress for insert
  with check (auth.uid() = user_id);

create policy "baseline_progress_update_own"
  on public.baseline_interview_progress for update
  using (auth.uid() = user_id);

create trigger baseline_progress_touch_updated_at
  before update on public.baseline_interview_progress
  for each row execute function public.touch_updated_at();
