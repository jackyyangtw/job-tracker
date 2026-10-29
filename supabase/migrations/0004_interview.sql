-- 面試時間與地點，不必再寫在備註裡。
-- 請在 0003_user_settings.sql 之後執行（Supabase Dashboard -> SQL Editor）。
-- 部署新版前端之前要先執行：前端寫入時會帶這兩個欄位，欄位不存在時儲存會失敗。

-- 面試時間是當地時間（台灣），和 applied_at 等日期欄位一樣不帶時區，所以用 timestamp 而不是 timestamptz。
alter table public.applications
  add column interview_at timestamp,
  add column interview_location text not null default '' check (char_length(interview_location) <= 300);
