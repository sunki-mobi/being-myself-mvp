-- ========================================================================
-- 008_daily_digest.sql
-- 매일 두 질문 보고서 digest 캐시
--
-- 이전: /api/me/digest 호출할 때마다 LLM 새로 합성 → 토큰 낭비 + 매 진입
-- 마다 결과 미세 달라짐.
--
-- 이후: 답변 완료 후 한 번 합성하고 user_id + digest_date(KST) 기준으로
-- 캐시. 보고서 페이지는 캐시 hit. 같은 날 새 답변이 쌓이면 qa_count로
-- staleness 판단 → 사용자가 "새로 만들기" 누르면 update.
--
-- 보고서 페이지 UI 재구성과 함께 — 이전 날짜 답변/digest는 날짜별로
-- 그룹해서 더보기 list로 표시.
-- ========================================================================

create table public.daily_digest (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  digest_date   date not null,                          -- KST 기준 날짜
  digest        jsonb not null,                          -- { summary, connections, tension, nextThread }
  qa_count      integer not null default 0,              -- 합성 시점 qa_pair 수 (staleness 판단)
  generated_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 한 사용자 + 한 날짜에 1 digest
create unique index daily_digest_user_date_unique
  on public.daily_digest(user_id, digest_date);

-- 보고서 페이지에서 날짜 list 조회용
create index daily_digest_user_recent_idx
  on public.daily_digest(user_id, digest_date desc);

alter table public.daily_digest enable row level security;

create policy "daily_digest_select_own"
  on public.daily_digest for select
  using (auth.uid() = user_id);

create policy "daily_digest_insert_own"
  on public.daily_digest for insert
  with check (auth.uid() = user_id);

create policy "daily_digest_update_own"
  on public.daily_digest for update
  using (auth.uid() = user_id);

create policy "daily_digest_delete_own"
  on public.daily_digest for delete
  using (auth.uid() = user_id);

create trigger daily_digest_touch_updated_at
  before update on public.daily_digest
  for each row execute function public.touch_updated_at();
