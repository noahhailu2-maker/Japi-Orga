-- Japi Orga · Schritt 1: Familie, Mitglieder, Beitritts-Code
-- Jedes Gerät meldet sich anonym an (auth.uid()) und gehört genau zu einer Familie.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Tabellen
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  dog_name    text not null default 'Japi' check (char_length(dog_name) between 1 and 40),
  join_code   text not null unique check (join_code ~ '^[A-Z2-9]{6}$'),
  created_at  timestamptz not null default now()
);

create table public.members (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 30),
  emoji         text not null check (char_length(emoji) between 1 and 16),
  created_at    timestamptz not null default now()
);
create index members_family_id_idx on public.members (family_id);

-- ---------------------------------------------------------------- Helfer
-- Familie des angemeldeten Geräts (security definer, damit RLS nicht rekursiv wird)
create or replace function public.my_family_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select family_id from public.members where user_id = (select auth.uid())
$$;

-- Lesbarer Code ohne verwechselbare Zeichen (kein 0/O, 1/I/L)
create or replace function public.generate_join_code()
returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.families f where f.join_code = code);
  end loop;
  return code;
end
$$;

-- ---------------------------------------------------------------- RLS
alter table public.families enable row level security;
alter table public.members  enable row level security;

create policy "Familie sieht sich selbst" on public.families
  for select to authenticated using (id = (select public.my_family_id()));

create policy "Familie darf Name/Hund ändern" on public.families
  for update to authenticated
  using (id = (select public.my_family_id()))
  with check (id = (select public.my_family_id()));

create policy "Mitglieder sehen ihre Familie" on public.members
  for select to authenticated using (family_id = (select public.my_family_id()));

create policy "Eigenes Profil ändern" on public.members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and family_id = (select public.my_family_id()));

create policy "Familie verlassen" on public.members
  for delete to authenticated using (user_id = (select auth.uid()));

-- Inserts nur über die Funktionen unten. join_code darf nicht per update geändert werden:
revoke update on public.families from authenticated, anon;
grant  update (name, dog_name) on public.families to authenticated;
revoke update on public.members from authenticated, anon;
grant  update (display_name, emoji) on public.members to authenticated;
revoke insert on public.families, public.members from authenticated, anon;

-- ---------------------------------------------------------------- RPCs
create or replace function public.create_family(
  p_family_name text, p_dog_name text, p_display_name text, p_emoji text
)
returns public.families
language plpgsql volatile security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  fam public.families;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.members where user_id = uid) then
    raise exception 'already_member';
  end if;

  insert into public.families (name, dog_name, join_code)
  values (trim(p_family_name), coalesce(nullif(trim(p_dog_name), ''), 'Japi'), public.generate_join_code())
  returning * into fam;

  insert into public.members (family_id, user_id, display_name, emoji)
  values (fam.id, uid, trim(p_display_name), p_emoji);

  return fam;
end
$$;

create or replace function public.join_family(
  p_code text, p_display_name text, p_emoji text
)
returns public.families
language plpgsql volatile security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  fam public.families;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.members where user_id = uid) then
    raise exception 'already_member';
  end if;

  select * into fam from public.families
  where join_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if fam.id is null then raise exception 'invalid_code'; end if;

  insert into public.members (family_id, user_id, display_name, emoji)
  values (fam.id, uid, trim(p_display_name), p_emoji);

  return fam;
end
$$;

-- Neuen Code erzeugen (z. B. wenn er in falsche Hände geraten ist)
create or replace function public.rotate_join_code()
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  fid uuid := public.my_family_id();
  code text;
begin
  if fid is null then raise exception 'not_member'; end if;
  code := public.generate_join_code();
  update public.families set join_code = code where id = fid;
  return code;
end
$$;

revoke execute on function public.create_family(text, text, text, text) from public, anon;
revoke execute on function public.join_family(text, text, text)        from public, anon;
revoke execute on function public.rotate_join_code()                   from public, anon;
revoke execute on function public.generate_join_code()                 from public, anon, authenticated;
grant  execute on function public.create_family(text, text, text, text) to authenticated;
grant  execute on function public.join_family(text, text, text)        to authenticated;
grant  execute on function public.rotate_join_code()                   to authenticated;

-- ---------------------------------------------------------------- Realtime
alter publication supabase_realtime add table public.members;
