-- 面試被問到的問題與（選填的）回答，給「面試題」頁整理複習用。
-- 請在 0006_resumes.sql 之後執行（Supabase Dashboard -> SQL Editor）。
-- 部署新版前端之前要先執行：前端寫入投遞時會帶這個欄位，欄位不存在時儲存會失敗。

-- 格式：[{ "question": "…", "answer": "…" }]，最多 50 題。每題的字數由前端限制，這裡只擋整體大小。
-- 用 case 而不是 and：Postgres 不保證 and 的求值順序，jsonb_array_length 遇到非陣列會直接報錯。
alter table public.applications
  add column interview_questions jsonb not null default '[]'::jsonb check (
    case
      when jsonb_typeof(interview_questions) = 'array'
        then jsonb_array_length(interview_questions) <= 50 and octet_length(interview_questions::text) <= 200000
      else false
    end
  );
