-- ============================================================
-- Faza 3a — numrat e ndjeshem ne tabela te vetat
--
-- RLS ne Postgres filtron RRESHTA, jo kolona, dhe Supabase ka nje rol te
-- vetem `authenticated`. Ndaj `jobs.profit` dhe `salesmen.commission_percent`
-- do te ishin te lexueshem nga cdo i loguar, pavaresisht UI-se.
-- SPEC §40 i kerkon pikerisht keta te mbrojtur ne databaze.
-- ============================================================

-- ---------- FITIMI ----------
create table if not exists public.job_financials (
  job_id     uuid primary key references public.jobs(id) on delete cascade,
  profit     numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.job_financials (job_id, profit)
select id, coalesce(profit, 0) from public.jobs
on conflict (job_id) do update set profit = excluded.profit;

-- ---------- KOMISIONI ----------
create table if not exists public.salesman_pay (
  salesman_id        uuid primary key references public.salesmen(id) on delete cascade,
  commission_percent numeric(5,2) not null default 15,
  updated_at         timestamptz not null default now()
);

insert into public.salesman_pay (salesman_id, commission_percent)
select id, coalesce(commission_percent, 15) from public.salesmen
on conflict (salesman_id) do update set commission_percent = excluded.commission_percent;

-- ---------- Trigger-at shkruajne te tabela e re ----------
-- SECURITY DEFINER: funksioni vepron si pronari, ndaj kalon mbi RLS-ne
-- admin-only te job_financials edhe kur shpenzimin e shton nje manager.
create or replace function public.fn_recalc_job_profit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.job_id, old.job_id);
  price  numeric;
begin
  select coalesce(total_price, 0) into price from public.jobs where id = target;

  insert into public.job_financials (job_id, profit, updated_at)
       values (target, price - public.fn_job_expense_total(target), now())
  on conflict (job_id) do update
       set profit = excluded.profit, updated_at = now();

  return coalesce(new, old);
end;
$$;

create or replace function public.fn_job_profit_on_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.job_financials (job_id, profit, updated_at)
       values (new.id,
               coalesce(new.total_price, 0) - public.fn_job_expense_total(new.id),
               now())
  on conflict (job_id) do update
       set profit = excluded.profit, updated_at = now();

  return new;
end;
$$;

-- Tani duhet AFTER, sepse shkruan ne nje tabele tjeter.
drop trigger if exists trg_job_profit_on_price on public.jobs;
create trigger trg_job_profit_on_price
  after insert or update of total_price on public.jobs
  for each row execute function public.fn_job_profit_on_price();

-- Cdo pune duhet te kete rreshtin e vet financiar qysh ne krijim.
drop trigger if exists trg_job_financials_seed on public.jobs;
create trigger trg_job_financials_seed
  after insert on public.jobs
  for each row execute function public.fn_job_profit_on_price();

-- Rreshti i pageses per cdo shites te ri.
create or replace function public.fn_salesman_pay_seed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.salesman_pay (salesman_id) values (new.id)
  on conflict (salesman_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_salesman_pay_seed on public.salesmen;
create trigger trg_salesman_pay_seed
  after insert on public.salesmen
  for each row execute function public.fn_salesman_pay_seed();

-- ---------- RLS: vetem admini ----------
alter table public.job_financials enable row level security;
alter table public.salesman_pay   enable row level security;

drop policy if exists "job_financials_admin" on public.job_financials;
create policy "job_financials_admin" on public.job_financials
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "salesman_pay_admin" on public.salesman_pay;
create policy "salesman_pay_admin" on public.salesman_pay
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Hiq burimet e dyfishta ----------
-- Nese mbeten, kthehet bug-u i dy burimeve te se vertetes (L2).
alter table public.jobs     drop column if exists profit;
alter table public.salesmen drop column if exists commission_percent;
