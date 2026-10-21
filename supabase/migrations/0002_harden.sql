-- 強化 applications 資料表。請在 0001_init.sql 之後執行（Supabase Dashboard -> SQL Editor）。
--
-- 關於 Realtime 的說明（見 0001 結尾的註解）：資料列內容會依 RLS 政策過濾，
-- 但 DELETE 事件無法過濾，所以其他已登入的使用者可能收到被刪除那一列的 id（一個 UUID，沒有其他內容）。
-- 前端只用這個 id 從自己的列表移除對應的資料列。

-- 1. 每次寫入（包含新增）時，時間戳都由資料庫決定。
--    - 新增：不管前端送什麼，created_at 與 updated_at 都是「現在」。
--    - 更新：updated_at 是「現在」，created_at 永遠不能被修改。
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = now();
  else
    new.created_at = old.created_at;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;

create trigger applications_set_updated_at
  before insert or update on public.applications
  for each row execute function public.set_updated_at();

-- 2. 職缺連結必須是空字串或 http(s) 網址（前端已經過濾過，這裡是第二層防護）。
--    如果這裡失敗，代表現有資料有不合規的網址：請修正或清空後再重新執行這個 migration。
alter table public.applications drop constraint if exists applications_url_scheme_check;
alter table public.applications
  add constraint applications_url_scheme_check check (url = '' or url ~* '^https?://');

-- 3. 縱深防禦：匿名角色完全沒有資料表權限，所以就算哪天 RLS 被誤關，
--    未登入的訪客仍然碰不到這張表。
revoke all on public.applications from anon;
