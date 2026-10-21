-- 投遞追蹤：資料表、Row Level Security 與 Realtime。
-- 在 Supabase Dashboard -> SQL Editor 執行一次（或用 Supabase CLI：supabase db push）。

create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company      text not null check (char_length(company) between 1 and 120),
  title        text not null default '' check (char_length(title) <= 160),
  url          text not null default '' check (char_length(url) <= 2000),
  source       text not null default '' check (source in ('', '104', 'Cake', 'LinkedIn', '內推', '公司官網', '其他')),
  status       text not null default 'applied' check (status in ('wishlist', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  applied_at   date,
  follow_up_at date,
  last_contact date,
  resume       text not null default '' check (char_length(resume) <= 80),
  note         text not null default '' check (char_length(note) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index applications_user_updated_idx on public.applications (user_id, updated_at desc);

-- Row Level Security：登入的使用者只能操作自己的資料列。
-- (select auth.uid()) 包成子查詢，Postgres 才會每個查詢只計算一次，而不是每一列都算。
alter table public.applications enable row level security;

create policy "applications_select_own" on public.applications
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "applications_insert_own" on public.applications
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "applications_update_own" on public.applications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "applications_delete_own" on public.applications
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 不管前端送什麼，都讓 updated_at 保持正確。
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- Realtime：手機上的變更不用重新整理就會出現在筆電上。
-- Realtime 會遵守上面的 RLS 政策，所以其他使用者收不到你的資料列。
alter publication supabase_realtime add table public.applications;
