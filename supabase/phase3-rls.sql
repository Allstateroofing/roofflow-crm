-- ============================================================
-- Faza 3b — RLS sipas roleve (SPEC §2, §27, §40)
-- ============================================================

-- ---------- Ndihmesat ----------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.my_salesman_id()
returns uuid language sql stable security definer set search_path = public as $$
  select salesman_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.my_worker_id()
returns uuid language sql stable security definer set search_path = public as $$
  select worker_id from public.profiles where id = auth.uid() and active
$$;

/** Zyra: shohin gjithcka operative. */
create or replace function public.is_office()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','secretary','manager'), false)
$$;

/** A e sheh perdoruesi kete pune? */
create or replace function public.can_see_job(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case public.my_role()
    when 'admin'     then true
    when 'secretary' then true
    when 'manager'   then true
    when 'salesman'  then exists (
      select 1 from public.jobs j
       where j.id = p_job and j.salesman_id = public.my_salesman_id())
    when 'worker'    then exists (
      select 1 from public.job_workers jw
       where jw.job_id = p_job and jw.worker_id = public.my_worker_id())
    else false
  end
$$;

-- ---------- JOBS ----------
alter table public.jobs enable row level security;
drop policy if exists "jobs_read"   on public.jobs;
drop policy if exists "jobs_write"  on public.jobs;
drop policy if exists "jobs_update" on public.jobs;
drop policy if exists "jobs_delete" on public.jobs;

create policy "jobs_read" on public.jobs
  for select to authenticated
  using (
    public.is_office()
    or (public.my_role() = 'salesman' and salesman_id = public.my_salesman_id())
    or (public.my_role() = 'worker' and exists (
          select 1 from public.job_workers jw
           where jw.job_id = jobs.id and jw.worker_id = public.my_worker_id()))
  );

create policy "jobs_write" on public.jobs
  for insert to authenticated with check (public.is_office());

create policy "jobs_update" on public.jobs
  for update to authenticated
  using (public.can_see_job(id)) with check (public.can_see_job(id));

create policy "jobs_delete" on public.jobs
  for delete to authenticated using (public.is_admin());

-- ---------- CLIENTS ----------
-- Shitesi/punetori sheh vetem klientet qe kane nje pune te tijen.
alter table public.clients enable row level security;
drop policy if exists "clients_read"   on public.clients;
drop policy if exists "clients_write"  on public.clients;
drop policy if exists "clients_update" on public.clients;
drop policy if exists "clients_delete" on public.clients;

create policy "clients_read" on public.clients
  for select to authenticated
  using (
    public.is_office()
    or exists (
      select 1 from public.jobs j
       where j.client_id = clients.id and public.can_see_job(j.id))
  );

create policy "clients_write" on public.clients
  for insert to authenticated with check (public.is_office());

create policy "clients_update" on public.clients
  for update to authenticated
  using (public.is_office()) with check (public.is_office());

create policy "clients_delete" on public.clients
  for delete to authenticated using (public.is_admin());

-- ---------- Tabelat e lidhura me nje pune ----------
do $$
declare t text;
begin
  foreach t in array array['job_workers','job_photos','estimates','invoices','payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_read"   on public.%I', t, t);
    execute format('drop policy if exists "%s_write"  on public.%I', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
  end loop;
end $$;

-- job_workers: sipas punes
create policy "job_workers_read" on public.job_workers
  for select to authenticated using (public.can_see_job(job_id));
create policy "job_workers_write" on public.job_workers
  for insert to authenticated with check (public.my_role() in ('admin','manager'));
create policy "job_workers_delete" on public.job_workers
  for delete to authenticated using (public.my_role() in ('admin','manager'));

-- job_photos: sipas punes ose klientit
create policy "job_photos_read" on public.job_photos
  for select to authenticated
  using (
    (job_id is not null and public.can_see_job(job_id))
    or (client_id is not null and (
         public.is_office()
         or exists (select 1 from public.jobs j
                     where j.client_id = job_photos.client_id
                       and public.can_see_job(j.id))))
  );
create policy "job_photos_write" on public.job_photos
  for insert to authenticated with check (auth.uid() is not null);
create policy "job_photos_delete" on public.job_photos
  for delete to authenticated using (public.is_admin());

-- estimates: zyra dhe shitesi i vet
create policy "estimates_read" on public.estimates
  for select to authenticated
  using (
    public.is_office()
    or (public.my_role() = 'salesman' and salesman_id = public.my_salesman_id())
  );
create policy "estimates_write" on public.estimates
  for insert to authenticated
  with check (public.my_role() in ('admin','secretary','manager','salesman'));
create policy "estimates_update" on public.estimates
  for update to authenticated
  using (public.is_office()
         or (public.my_role() = 'salesman' and salesman_id = public.my_salesman_id()))
  with check (true);
create policy "estimates_delete" on public.estimates
  for delete to authenticated using (public.is_admin());

-- invoices dhe payments: vetem admin dhe sekretare (SPEC §24)
create policy "invoices_read" on public.invoices
  for select to authenticated using (public.my_role() in ('admin','secretary'));
create policy "invoices_write" on public.invoices
  for insert to authenticated with check (public.my_role() in ('admin','secretary'));
create policy "invoices_update" on public.invoices
  for update to authenticated
  using (public.my_role() in ('admin','secretary')) with check (true);
create policy "invoices_delete" on public.invoices
  for delete to authenticated using (public.is_admin());

create policy "payments_read" on public.payments
  for select to authenticated using (public.my_role() in ('admin','secretary'));
create policy "payments_write" on public.payments
  for insert to authenticated with check (public.my_role() in ('admin','secretary'));
create policy "payments_update" on public.payments
  for update to authenticated
  using (public.my_role() in ('admin','secretary')) with check (true);
create policy "payments_delete" on public.payments
  for delete to authenticated using (public.is_admin());

-- ---------- JOB EXPENSES: admin dhe manager (V4) ----------
alter table public.job_expenses enable row level security;
drop policy if exists "job_expenses_read"   on public.job_expenses;
drop policy if exists "job_expenses_write"  on public.job_expenses;
drop policy if exists "job_expenses_update" on public.job_expenses;
drop policy if exists "job_expenses_delete" on public.job_expenses;

create policy "job_expenses_read" on public.job_expenses
  for select to authenticated using (public.my_role() in ('admin','manager'));
create policy "job_expenses_write" on public.job_expenses
  for insert to authenticated with check (public.my_role() in ('admin','manager'));
create policy "job_expenses_update" on public.job_expenses
  for update to authenticated
  using (public.my_role() in ('admin','manager')) with check (true);
create policy "job_expenses_delete" on public.job_expenses
  for delete to authenticated using (public.my_role() in ('admin','manager'));

-- ---------- Listat e perbashketa ----------
-- Emrat e shitesve dhe punetoreve duhen per dropdown-at; pagesa e tyre jo.
do $$
declare t text;
begin
  foreach t in array array['salesmen','workers','zones'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_read"   on public.%I', t, t);
    execute format('drop policy if exists "%s_write"  on public.%I', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);

    execute format('create policy "%s_read" on public.%I
      for select to authenticated using (true)', t, t);
    execute format('create policy "%s_write" on public.%I
      for insert to authenticated with check (public.my_role() in (''admin'',''manager''))', t, t);
    execute format('create policy "%s_update" on public.%I
      for update to authenticated using (public.my_role() in (''admin'',''manager'')) with check (true)', t, t);
    execute format('create policy "%s_delete" on public.%I
      for delete to authenticated using (public.is_admin())', t, t);
  end loop;
end $$;
