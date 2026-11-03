-- 新增「等待中」狀態（awaiting）：面試結束、等待結果的職缺。
-- 請在 0004_interview.sql 之後執行（Supabase Dashboard -> SQL Editor）。
-- 部署新版前端之前要先執行：否則把投遞改成「等待中」時，資料庫的 check constraint 會擋下寫入。

-- 0001 的 check 沒有命名，Postgres 自動命名為 applications_status_check。
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications
  add constraint applications_status_check
  check (status in ('wishlist', 'applied', 'interview', 'awaiting', 'offer', 'rejected', 'withdrawn'));
