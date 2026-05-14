-- ========================================================================
-- 006_somyeong_diary.sql
-- 소명일기 — 일일 reflection 기능
--
-- 매일 저녁 사용자가 퇴근 보고를 paste → AI가 "기여 흐름"(direct·translated·
-- open_questions·suggested_questions)으로 묶음 → 사용자가 일기 작성.
--
-- 두 테이블:
--   - somyeong_user_okr: 사용자별 분기 OKR (AI가 매핑 컨텍스트로 참조).
--     없어도 동작 — baseline_report로 fallback.
--   - somyeong_entries: 일일 entry. user_id + entry_date unique (하루 1개).
--
-- 거버넌스 (스펙 §6): RLS로 본인만 read/write. 운영자도 콘텐츠 접근 불가
-- (service_role key는 서버에서만 사용).
-- ========================================================================

-- 1) somyeong_user_okr -----------------------------------------------------
create table public.somyeong_user_okr (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  quarter         text not null,                       -- '2026-Q2' 같은 라벨
  mission_text    text,                                -- 사업부 미션 (긴 문장)
  weekly_goal     text,                                -- 금주 목표
  okr_data        jsonb not null default '{}'::jsonb,  -- objectives·key_results JSON
  effective_from  date not null default current_date,
  effective_to    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 한 사용자당 한 분기에 한 OKR row (재작성은 update)
create unique index somyeong_user_okr_user_quarter_unique
  on public.somyeong_user_okr(user_id, quarter);

alter table public.somyeong_user_okr enable row level security;

create policy "okr_select_own"
  on public.somyeong_user_okr for select
  using (auth.uid() = user_id);

create policy "okr_insert_own"
  on public.somyeong_user_okr for insert
  with check (auth.uid() = user_id);

create policy "okr_update_own"
  on public.somyeong_user_okr for update
  using (auth.uid() = user_id);

create policy "okr_delete_own"
  on public.somyeong_user_okr for delete
  using (auth.uid() = user_id);

create trigger somyeong_user_okr_touch_updated_at
  before update on public.somyeong_user_okr
  for each row execute function public.touch_updated_at();

-- 2) somyeong_entries ------------------------------------------------------
create table public.somyeong_entries (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  entry_date            date not null,                 -- 사용자 시간대 기준 YYYY-MM-DD
  evening_report_text   text not null,                 -- paste한 퇴근 보고 원문
  contribution_flow     jsonb not null default '{}'::jsonb,  -- AI 출력 (direct·translated·open_questions·suggested_questions)
  ai_question           text,                          -- 선택된 일기 prompt 질문 (HTML 가능)
  ai_question_source    text,                          -- 'Direct contribution에서' 등
  answer                text,                          -- 질문에 대한 답 (선택)
  free_note             text,                          -- 자유 일기 (선택)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 하루 한 entry (재작성은 update)
create unique index somyeong_entries_user_date_unique
  on public.somyeong_entries(user_id, entry_date);

create index somyeong_entries_user_recent_idx
  on public.somyeong_entries(user_id, entry_date desc);

alter table public.somyeong_entries enable row level security;

create policy "diary_select_own"
  on public.somyeong_entries for select
  using (auth.uid() = user_id);

create policy "diary_insert_own"
  on public.somyeong_entries for insert
  with check (auth.uid() = user_id);

create policy "diary_update_own"
  on public.somyeong_entries for update
  using (auth.uid() = user_id);

create policy "diary_delete_own"
  on public.somyeong_entries for delete
  using (auth.uid() = user_id);

create trigger somyeong_entries_touch_updated_at
  before update on public.somyeong_entries
  for each row execute function public.touch_updated_at();

-- 3) 사용 수치 view (콘텐츠 0, admin 모니터링용) -----------------------------
-- 스펙 §6 — 회사가 볼 수 있는 건 단 하나: 사용 수치. 콘텐츠는 어디에도 노출 X.
-- (생성만 해두고 admin role 권한은 별도 부여 — Supabase 대시보드에서 service role
-- 또는 별도 admin role 만들 때 GRANT)
create view public.somyeong_usage_metrics as
select
  user_id,
  date_trunc('day', created_at) as day,
  count(*)::integer as entries_created
from public.somyeong_entries
group by user_id, date_trunc('day', created_at);

-- 이 view에서는 콘텐츠(evening_report_text·answer·free_note 등) SELECT 안 됨.
