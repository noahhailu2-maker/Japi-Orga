-- Japi Orga · Schritt 2: Aufgaben + Einträge (Checkliste & Verlauf)

-- ---------------------------------------------------------------- Einstellungen der Familie
alter table public.families
  add column if not exists double_feed_hours numeric(4,1) not null default 3
    check (double_feed_hours >= 0 and double_feed_hours <= 24);
grant update (name, dog_name, double_feed_hours) on public.families to authenticated;

-- ---------------------------------------------------------------- Tabellen
create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  kind           text not null default 'custom' check (kind in ('futter', 'gassi', 'spielen', 'custom')),
  name           text not null check (char_length(name) between 1 and 40),
  emoji          text not null check (char_length(emoji) between 1 and 16),
  times_per_day  int  not null default 1 check (times_per_day between 0 and 12),
  sort           int  not null default 100,
  archived       boolean not null default false,
  created_at     timestamptz not null default now()
);
create index tasks_family_idx on public.tasks (family_id) where not archived;

create table public.logs (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  task_id     uuid not null references public.tasks(id) on delete cascade,
  member_id   uuid references public.members(id) on delete set null,
  source      text not null default 'app' check (source in ('app', 'nfc')),
  done_at     timestamptz not null default now()
);
create index logs_family_done_idx on public.logs (family_id, done_at desc);
create index logs_task_idx on public.logs (task_id);
create index logs_member_idx on public.logs (member_id);

-- ---------------------------------------------------------------- RLS
alter table public.tasks enable row level security;
alter table public.logs  enable row level security;

create policy "Familie sieht Aufgaben" on public.tasks
  for select to authenticated using (family_id = (select public.my_family_id()));
create policy "Familie legt Aufgaben an" on public.tasks
  for insert to authenticated with check (family_id = (select public.my_family_id()));
create policy "Familie ändert Aufgaben" on public.tasks
  for update to authenticated
  using (family_id = (select public.my_family_id()))
  with check (family_id = (select public.my_family_id()));

create policy "Familie sieht Einträge" on public.logs
  for select to authenticated using (family_id = (select public.my_family_id()));
-- Rückgängig / Korrektur: jedes Familienmitglied darf Einträge der eigenen Familie löschen
create policy "Familie löscht Einträge" on public.logs
  for delete to authenticated using (family_id = (select public.my_family_id()));

-- Rechte explizit (neue Supabase-Projekte vergeben keine automatisch)
grant select, insert on public.tasks to authenticated;
grant update (name, emoji, times_per_day, sort, archived) on public.tasks to authenticated;
grant select, delete on public.logs to authenticated;
-- Einträge entstehen nur über log_task() (setzt Person + Familie selbst)

-- ---------------------------------------------------------------- Standard-Aufgaben
create or replace function public.seed_default_tasks(p_family_id uuid)
returns void
language sql volatile security definer set search_path = ''
as $$
  insert into public.tasks (family_id, kind, name, emoji, times_per_day, sort)
  select p_family_id, v.kind, v.name, v.emoji, v.times, v.sort
  from (values
    ('futter',  'Futter',  '🍖', 2, 10),
    ('gassi',   'Gassi',   '🦮', 3, 20),
    ('spielen', 'Spielen', '🎾', 1, 30)
  ) as v(kind, name, emoji, times, sort)
  where not exists (select 1 from public.tasks t where t.family_id = p_family_id);
$$;
revoke execute on function public.seed_default_tasks(uuid) from public, anon, authenticated;

-- Bestehende Familien bekommen die Standard-Aufgaben
select public.seed_default_tasks(id) from public.families;

-- Neue Familien automatisch
create or replace function public.on_family_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.seed_default_tasks(new.id);
  return new;
end
$$;
revoke execute on function public.on_family_created() from public, anon, authenticated;
create trigger family_seed_tasks after insert on public.families
  for each row execute function public.on_family_created();

-- ---------------------------------------------------------------- Erledigt eintragen
create or replace function public.log_task(p_task_id uuid, p_source text default 'app')
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

  insert into public.logs (family_id, task_id, member_id, source)
  values (me.family_id, t.id, me.id, case when p_source = 'nfc' then 'nfc' else 'app' end)
  returning * into l;
  return l;
end
$$;
revoke execute on function public.log_task(uuid, text) from public, anon;
grant  execute on function public.log_task(uuid, text) to authenticated;

-- ---------------------------------------------------------------- Realtime
alter publication supabase_realtime add table public.tasks, public.logs, public.families;
