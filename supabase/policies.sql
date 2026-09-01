-- ============================================================
-- RoofFlow CRM — politikat RLS
-- Zevendeson politiken e vetme "authenticated_all", e cila lejonte
-- cdo perdorues te loguar te ndryshonte cdo rresht — perfshi rolin e vet.
-- ============================================================

-- ---------- Ndihmes: roli i perdoruesit aktual ----------
-- SECURITY DEFINER qe te mos hyje vete ne rekursion me RLS-ne e profiles.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' and active from public.profiles where id = auth.uid()),
    false
  )
$$;

-- ---------- PROFILES ----------
-- Leximi: te gjithe te loguarit (nevojitet per emrat dhe per njoftimet).
-- Shkrimi: vetem admini. Askush nuk e ndryshon dot rolin e vet.
drop policy if exists "authenticated_all" on public.profiles;
drop policy if exists "profiles_select"  on public.profiles;
drop policy if exists "profiles_write"   on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_write" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- TE DHENAT E PUNES ----------
-- CRM i brendshem: cdo punonjes aktiv lexon dhe shkruan.
-- Fshirja mbahet vetem per adminin, qe nje gabim te mos zhduket pune e tere.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','salesmen','workers','zones','estimates','jobs',
    'job_workers','job_expenses','job_photos','invoices','payments'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "authenticated_all" on public.%I', t);
    execute format('drop policy if exists "%s_read"   on public.%I', t, t);
    execute format('drop policy if exists "%s_write"  on public.%I', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);

    execute format(
      'create policy "%s_read" on public.%I
         for select to authenticated using (true)', t, t);

    execute format(
      'create policy "%s_write" on public.%I
         for insert to authenticated with check (true)', t, t);

    execute format(
      'create policy "%s_update" on public.%I
         for update to authenticated using (true) with check (true)', t, t);

    execute format(
      'create policy "%s_delete" on public.%I
         for delete to authenticated using (public.is_admin())', t, t);
  end loop;
end $$;

-- ---------- NOTIFICATIONS ----------
-- Secili sheh vetem njoftimet e veta; kushdo mund t'i dergoje njoftim tjetrit.
alter table public.notifications enable row level security;

drop policy if exists "authenticated_all"     on public.notifications;
drop policy if exists "notifications_read"    on public.notifications;
drop policy if exists "notifications_insert"  on public.notifications;
drop policy if exists "notifications_update"  on public.notifications;

create policy "notifications_read" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_insert" on public.notifications
  for insert to authenticated with check (true);

create policy "notifications_update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
