-- ============================================================
-- RoofFlow CRM — rregullimi i L1, L2, L3
-- ============================================================

-- ------------------------------------------------------------
-- L1 — pagesat mbanin ose job_id ose client_id, kurre te dyja,
--      ndaj faqja e punes dhe ajo e klientit nuk shihnin njera-tjetren.
-- ------------------------------------------------------------

-- Mbush retroaktivisht klientin nga puna perkatese.
update public.payments p
   set client_id = j.client_id
  from public.jobs j
 where p.job_id = j.id
   and p.client_id is null;

-- Nga tani e tutje behet vete, pavaresisht se cila faqe e shkruan.
create or replace function public.fn_payment_fill_client()
returns trigger
language plpgsql
as $$
begin
  if new.client_id is null and new.job_id is not null then
    select client_id into new.client_id
      from public.jobs where id = new.job_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payment_fill_client on public.payments;

create trigger trg_payment_fill_client
  before insert or update of job_id, client_id on public.payments
  for each row execute function public.fn_payment_fill_client();


-- ------------------------------------------------------------
-- L2 — jobs.profit rillogaritej vetem kur SHTOHEJ nje shpenzim.
--      Fshirja e nje shpenzimi e linte te ngecur pergjithmone.
--      Tani eshte plotesisht i derivuar: cmimi minus shpenzimet.
-- ------------------------------------------------------------

create or replace function public.fn_job_expense_total(p_job uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(amount), 0) from public.job_expenses where job_id = p_job
$$;

-- Kur ndryshojne shpenzimet → rillogarit punen perkatese.
create or replace function public.fn_recalc_job_profit()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.job_id, old.job_id);
begin
  update public.jobs
     set profit = coalesce(total_price, 0) - public.fn_job_expense_total(target)
   where id = target;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalc_job_profit on public.job_expenses;

create trigger trg_recalc_job_profit
  after insert or update or delete on public.job_expenses
  for each row execute function public.fn_recalc_job_profit();

-- Kur ndryshon cmimi i punes → rillogarit ne vend, pa update te dyte.
create or replace function public.fn_job_profit_on_price()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT'
     or new.total_price is distinct from old.total_price then
    new.profit := coalesce(new.total_price, 0)
                  - public.fn_job_expense_total(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_job_profit_on_price on public.jobs;

create trigger trg_job_profit_on_price
  before insert or update of total_price on public.jobs
  for each row execute function public.fn_job_profit_on_price();

-- Njesoji te gjitha rreshtat ekzistuese me te njejtin perkufizim.
update public.jobs j
   set profit = coalesce(j.total_price, 0) - public.fn_job_expense_total(j.id);


-- ------------------------------------------------------------
-- L3 — nuk kishte asnje lidhje mes llogarise (auth.users / profiles)
--      dhe rreshtit te salesman-it ose punetorit, ndaj filtrat
--      krahasonin ID nga dy hapesira te ndryshme dhe s'gjenin kurre asgje.
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists salesman_id uuid
    references public.salesmen(id) on delete set null;

alter table public.profiles
  add column if not exists worker_id uuid
    references public.workers(id) on delete set null;

create index if not exists idx_profiles_salesman on public.profiles(salesman_id);
create index if not exists idx_profiles_worker   on public.profiles(worker_id);
