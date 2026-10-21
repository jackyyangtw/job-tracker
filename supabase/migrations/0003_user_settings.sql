-- 每位使用者的偏好設定，讓「超過 N 天沒消息就提醒」在所有裝置上一致。
-- 請在 0002_harden.sql 之後執行（Supabase Dashboard -> SQL Editor）。

create table public.user_settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  stale_days integer not null default 14 check (stale_days in (7, 10, 14, 21, 30)),
  updated_at timestamptz not null default now()
);

-- Row Level Security：每個人只能讀寫自己的設定。
alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own" on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own" on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- updated_at 一律由資料庫設定。
-- 不共用 set_updated_at()：那個函式也會處理 created_at，而這張表沒有這個欄位。
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_touch_updated_at
  before insert or update on public.user_settings
  for each row execute function public.touch_updated_at();

-- 縱深防禦：匿名角色完全沒有資料表權限。
revoke all on public.user_settings from anon;
