-- Japi Orga · Auswahl + Notiz pro Eintrag, Familien-Chat

-- ---------------------------------------------------------------- Auswahl pro Aufgabe
alter table public.tasks
  add column if not exists options text[] not null default '{}'
    check (cardinality(options) <= 8);
grant update (name, emoji, times_per_day, sort, archived, options) on public.tasks to authenticated;

update public.tasks set options = array['Ganze Portion', 'Halbe Portion', 'Kaum gegessen']
where kind = 'futter' and options = '{}';

create or replace function public.seed_default_tasks(p_family_id uuid)
returns void
language sql volatile security definer set search_path = ''
as $$
  insert into public.tasks (family_id, kind, name, emoji, times_per_day, sort, options)
  select p_family_id, v.kind, v.name, v.emoji, v.times, v.sort, v.options
  from (values
    ('futter',  'Futter',  '🍖', 2, 10, array['Ganze Portion', 'Halbe Portion', 'Kaum gegessen']),
    ('gassi',   'Gassi',   '🦮', 3, 20, array[]::text[]),
    ('spielen', 'Spielen', '🎾', 1, 30, array[]::text[])
  ) as v(kind, name, emoji, times, sort, options)
  where not exists (select 1 from public.tasks t where t.family_id = p_family_id);
$$;
revoke execute on function public.seed_default_tasks(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- Auswahl + Notiz pro Eintrag
alter table public.logs
  add column if not exists choice text check (char_length(choice) <= 40),
  add column if not exists note   text check (char_length(note) <= 300);

create policy "Familie ergänzt Einträge" on public.logs
  for update to authenticated
  using (family_id = (select public.my_family_id()))
  with check (family_id = (select public.my_family_id()));
grant update (choice, note) on public.logs to authenticated;

drop function if exists public.log_task(uuid, text);
create or replace function public.log_task(
  p_task_id uuid, p_source text default 'app', p_choice text default null, p_note text default null
)
returns public.logs
language plpgsql volatile security definer set search_path = ''
as $$
declare
  me public.members;
  t  public.tasks;
  l  public.logs;
begin
  select * into me from public.members where user_id = auth.uid();
  if me.id is null then raise exception 'not_member'; end if;

  select * into t from public.tasks where id = p_task_id and family_id = me.family_id and not archived;
  if t.id is null then raise exception 'task_not_found'; end if;

  insert into public.logs (family_id, task_id, member_id, source, choice, note)
  values (me.family_id, t.id, me.id,
          case when p_source = 'nfc' then 'nfc' else 'app' end,
          nullif(trim(p_choice), ''), nullif(trim(p_note), ''))
  returning * into l;
  return l;
end
$$;
revoke execute on function public.log_task(uuid, text, text, text) from public, anon;
grant  execute on function public.log_task(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------- Familien-Chat
create or replace function public.my_member_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.members where user_id = (select auth.uid())
$$;
grant execute on function public.my_member_id() to authenticated;

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null default public.my_family_id() references public.families(id) on delete cascade,
  member_id   uuid default public.my_member_id() references public.members(id) on delete set null,
  body        text not null check (char_length(trim(body)) between 1 and 1000),
  created_at  timestamptz not null default now()
);
create index messages_family_created_idx on public.messages (family_id, created_at desc);
create index messages_member_idx on public.messages (member_id);

alter table public.messages enable row level security;
create policy "Familie liest Chat" on public.messages
  for select to authenticated using (family_id = (select public.my_family_id()));
create policy "Familie schreibt Chat" on public.messages
  for insert to authenticated
  with check (family_id = (select public.my_family_id()) and member_id = (select public.my_member_id()));
create policy "Eigene Nachricht löschen" on public.messages
  for delete to authenticated using (member_id = (select public.my_member_id()));

grant select, delete on public.messages to authenticated;
grant insert (body) on public.messages to authenticated;

alter publication supabase_realtime add table public.messages;
