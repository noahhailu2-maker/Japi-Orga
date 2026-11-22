-- Japi Orga · Leserechte ausdrücklich vergeben.
-- Neuere Supabase-Projekte geben neuen Tabellen nicht mehr automatisch Rechte für die App.
-- Die Row-Level-Security-Regeln aus 0001 bestimmen weiterhin, wer welche Zeilen sieht.
grant usage on schema public to anon, authenticated;
grant select on public.families, public.members to authenticated;
grant update (name, dog_name) on public.families to authenticated;
grant update (display_name, emoji) on public.members to authenticated;
grant delete on public.members to authenticated;
grant execute on function public.my_family_id() to authenticated;
grant execute on function public.create_family(text, text, text, text) to authenticated;
grant execute on function public.join_family(text, text, text) to authenticated;
grant execute on function public.rotate_join_code() to authenticated;
