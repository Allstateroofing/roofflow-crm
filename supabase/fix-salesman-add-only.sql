-- ============================================================
-- Shitesi i SHTON shpenzimet dhe pagesat e punes se vet — i blen materialet
-- dhe merr paren ne dore — por nuk i ndryshon dhe nuk i fshin dot pastaj.
-- Kufizimi `can_see_job` e mban brenda puneve te veta: nuk prek dot ato te
-- kolegeve, as duke iu drejtuar direkt databazes.
-- ============================================================

-- ---------- SHPENZIMET ----------
drop policy if exists "job_expenses_read"   on public.job_expenses;
drop policy if exists "job_expenses_write"  on public.job_expenses;
drop policy if exists "job_expenses_update" on public.job_expenses;
drop policy if exists "job_expenses_delete" on public.job_expenses;

create policy "job_expenses_read" on public.job_expenses
  for select to authenticated
  using (
    public.my_role() in ('admin', 'manager')
    or (public.my_role() = 'salesman' and public.can_see_job(job_id))
  );

create policy "job_expenses_write" on public.job_expenses
  for insert to authenticated
  with check (
    public.my_role() in ('admin', 'manager')
    or (public.my_role() = 'salesman' and public.can_see_job(job_id))
  );

-- Ndryshimi dhe fshirja mbeten te zyra.
create policy "job_expenses_update" on public.job_expenses
  for update to authenticated
  using (public.my_role() in ('admin', 'manager'))
  with check (public.my_role() in ('admin', 'manager'));

create policy "job_expenses_delete" on public.job_expenses
  for delete to authenticated
  using (public.my_role() in ('admin', 'manager'));

-- ---------- PAGESAT ----------
drop policy if exists "payments_read"   on public.payments;
drop policy if exists "payments_write"  on public.payments;
drop policy if exists "payments_update" on public.payments;
drop policy if exists "payments_delete" on public.payments;

create policy "payments_read" on public.payments
  for select to authenticated
  using (
    public.my_role() in ('admin', 'secretary')
    or (public.my_role() = 'salesman' and public.can_see_job(job_id))
  );

create policy "payments_write" on public.payments
  for insert to authenticated
  with check (
    public.my_role() in ('admin', 'secretary')
    or (public.my_role() = 'salesman' and public.can_see_job(job_id))
  );

create policy "payments_update" on public.payments
  for update to authenticated
  using (public.my_role() in ('admin', 'secretary'))
  with check (public.my_role() in ('admin', 'secretary'));

create policy "payments_delete" on public.payments
  for delete to authenticated
  using (public.is_admin());

-- ---------- FOTOT ----------
-- Shtimi ishte tashme i hapur dhe fshirja vetem per adminin. Mungonte
-- rregulli i ndryshimit: pa te, askush nuk i ndryshon dot — sic duhet.
