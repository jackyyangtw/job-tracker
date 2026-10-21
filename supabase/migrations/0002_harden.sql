-- Hardening for the applications table. Run after 0001_init.sql (Supabase Dashboard -> SQL Editor).
--
-- Note on Realtime (see the comment at the end of 0001): row contents are filtered by the RLS policies,
-- but DELETE events cannot be filtered, so other signed-in users may receive the id (a UUID, nothing else)
-- of a row that was deleted. The client only uses that id to drop a matching row from its own list.

-- 1. Timestamps are owned by the database on every write, including inserts.
--    - insert: created_at and updated_at are both "now", whatever the client sent.
--    - update: updated_at is "now", created_at can never be changed.
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

-- 2. The job link must be empty or an http(s) URL (the client already filters this; this is the second layer).
--    If this fails, an existing row has a bad url: fix or clear it, then run this migration again.
alter table public.applications drop constraint if exists applications_url_scheme_check;
alter table public.applications
  add constraint applications_url_scheme_check check (url = '' or url ~* '^https?://');

-- 3. Defense in depth: the anonymous role gets no table privileges at all, so even if RLS were ever
--    switched off by mistake, signed-out visitors still could not touch the table.
revoke all on public.applications from anon;
