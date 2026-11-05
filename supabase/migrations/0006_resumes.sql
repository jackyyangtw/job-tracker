-- 履歷版本：每個版本是一個網址或一份 PDF，投遞時可以選擇用了哪一版。
-- 請在 0005_awaiting_status.sql 之後執行（Supabase Dashboard -> SQL Editor）。
-- 部署新版前端之前要先執行：前端寫入投遞時會帶 resume_id，欄位不存在時儲存會失敗。

-- 1. 履歷版本資料表
create table public.resumes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  kind       text not null check (kind in ('url', 'pdf')),
  url        text not null default '' check (char_length(url) <= 2000 and (url = '' or url ~* '^https?://')),
  -- PDF 在 Storage（resumes bucket）裡的路徑：`<user_id>/<resume id>.pdf`
  file_path  text not null default '' check (char_length(file_path) <= 200),
  -- 上傳時的原始檔名，只用來顯示
  file_name  text not null default '' check (char_length(file_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'url' and url <> '') or (kind = 'pdf' and file_path <> '')),
  -- 給 applications 的複合外鍵用：投遞只能指向同一個使用者的履歷版本。
  unique (id, user_id)
);

create index resumes_user_idx on public.resumes (user_id, created_at);

alter table public.resumes enable row level security;

create policy "resumes_select_own" on public.resumes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "resumes_insert_own" on public.resumes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "resumes_update_own" on public.resumes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "resumes_delete_own" on public.resumes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- created_at／updated_at 由資料庫決定（共用 0002 的函式）。
create trigger resumes_set_updated_at
  before insert or update on public.resumes
  for each row execute function public.set_updated_at();

revoke all on public.resumes from anon;

alter publication supabase_realtime add table public.resumes;

-- 2. 投遞記錄用了哪個履歷版本。
--    原本的 resume 文字欄位保留：存版本名稱，統計與匯出照舊使用；刪除版本後仍留下名稱當作紀錄。
--    複合外鍵確保只能指向自己的履歷；刪除履歷時只把 resume_id 清空（PG15 的欄位清單語法）。
alter table public.applications
  add column resume_id uuid,
  add constraint applications_resume_fk foreign key (resume_id, user_id)
    references public.resumes (id, user_id) on delete set null (resume_id);

create index applications_resume_idx on public.applications (resume_id) where resume_id is not null;

-- 3. 履歷版本改名時，同步更新用到它的投遞上的名稱（統計頁依名稱分組）。
--    security invoker：照常套用 RLS，只會改到自己的投遞。
create or replace function public.sync_resume_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    update public.applications
      set resume = new.name
      where resume_id = new.id and user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger resumes_sync_name
  after update of name on public.resumes
  for each row execute function public.sync_resume_name();

-- 4. 存放 PDF 的 Storage bucket：私有、只收 PDF、單檔 10 MB。
--    開啟時由前端產生有時效的簽章網址，瀏覽器會直接預覽而不是下載。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 每個人只能存取自己資料夾（第一層資料夾名稱 = 自己的 user id）裡的檔案。
create policy "resumes_files_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "resumes_files_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 更換檔案時用 upsert 覆蓋同一路徑，需要 update 權限。
create policy "resumes_files_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "resumes_files_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
