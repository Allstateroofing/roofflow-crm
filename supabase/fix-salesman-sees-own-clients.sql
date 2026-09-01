-- ============================================================
-- Shitesi tani i takon KLIENTIT, por RLS-ja e kish mbetur te PUNA.
-- Pasoja: nje klient i caktuar te Glen-i, puna e te cilit s'kishte
-- ende shites, nuk i dukej fare Glen-it. Kjo e rregullon ne dy ana.
-- ============================================================

-- ---------- 1. Punet pa shites e marrin nga klienti ----------
update public.jobs j
set salesman_id = c.salesman_id
from public.clients c
where c.id = j.client_id
  and j.salesman_id is null
  and c.salesman_id is not null;

-- Kur admini i cakton klientit nje shites, punet e tij qe s'kane ende
-- shites e marrin ate. Punet e caktuara nuk preken — kush e shiti, e mban.
create or replace function public.fn_client_salesman_to_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.salesman_id is distinct from old.salesman_id
     and new.salesman_id is not null then
    update public.jobs
    set salesman_id = new.salesman_id
    where client_id = new.id and salesman_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_client_salesman_to_jobs on public.clients;

create trigger trg_client_salesman_to_jobs
  after update of salesman_id on public.clients
  for each row execute function public.fn_client_salesman_to_jobs();

-- ---------- 2. RLS: shitesi sheh cfare eshte e tija ----------
-- Nje pune i takon shitesit ose direkt, ose sepse klienti eshte i tiji.
create or replace function public.can_see_job(p_job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.my_role()
    when 'admin'     then true
    when 'secretary' then true
    when 'manager'   then true
    when 'salesman'  then exists (
      select 1 from public.jobs j
        left join public.clients c on c.id = j.client_id
       where j.id = p_job
         and (j.salesman_id = public.my_salesman_id()
              or c.salesman_id = public.my_salesman_id()))
    when 'worker'    then exists (
      select 1 from public.job_workers jw
       where jw.job_id = p_job and jw.worker_id = public.my_worker_id())
    else false
  end
$$;

-- Klienti duket edhe kur s'ka ende asnje pune — mjafton te jete i tiji.
drop policy if exists "clients_read" on public.clients;

create policy "clients_read" on public.clients
  for select to authenticated
  using (
    public.is_office()
    or salesman_id = public.my_salesman_id()
    or exists (
      select 1 from public.jobs j
      where j.client_id = clients.id and public.can_see_job(j.id)
    )
  );
