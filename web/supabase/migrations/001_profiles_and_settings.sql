-- ========================================================================
-- 001_profiles_and_settings.sql
-- Phase 1: 인증 + 사용자 데이터 모델
--
-- - profiles: auth.users와 1:1, 표시용 사용자 정보
-- - user_settings: prepare 1회 제한 등 사용자별 환경 설정
-- - 자동 동기화 트리거: auth.users INSERT 시 두 테이블 row 자동 생성
-- ========================================================================

-- 1) profiles ---------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 2) user_settings ----------------------------------------------------------
create table public.user_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  prepare_seen    boolean not null default false,
  baseline_method text check (baseline_method in ('interview', 'import')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- 3) updated_at 자동 갱신 -----------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- 4) auth.users INSERT 시 profiles + user_settings 자동 생성 -------------------
-- security definer로 RLS 우회 (트리거는 user 권한이 아니라 postgres 권한으로 INSERT).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'display_name', '')
  );

  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
