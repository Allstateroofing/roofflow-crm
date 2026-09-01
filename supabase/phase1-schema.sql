-- ============================================================
-- Faza 1 — skema sipas docs/SPEC.md
-- ============================================================

-- ---------- JOBS ----------
-- Takimi rri te puna (V1–V3): çdo telefonatë që çon në vizitë krijon një job.
alter table public.jobs add column if not exists reason_for_call text;
alter table public.jobs add column if not exists job_type        text;
alter table public.jobs add column if not exists time_window     text;
alter table public.jobs add column if not exists cancelled_at    timestamptz;
alter table public.jobs add column if not exists cancel_reason   text;

comment on column public.jobs.scheduled_date is 'Data e takimit/vizites';
comment on column public.jobs.time_window    is 'Interval standard: 9-11, 11-13, 13-15, 15-17';
comment on column public.jobs.scheduled_time is 'Ora e lire, kur nuk perdoret nje interval standard';

-- Vetem njera: ose interval standard, ose ore e lire.
alter table public.jobs drop constraint if exists jobs_time_choice;
alter table public.jobs add constraint jobs_time_choice
  check (time_window is null or scheduled_time is null);

alter table public.jobs drop constraint if exists jobs_time_window_check;
alter table public.jobs add constraint jobs_time_window_check
  check (time_window is null or time_window in ('9-11','11-13','13-15','15-17'));

-- Pipeline-i i mbyllur, me 'cancelled' te shtuar (V9).
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('new','inspection','estimate_sent','approved',
                    'scheduled','in_progress','done','cancelled'));

-- Data e anullimit mbushet vete.
create or replace function public.fn_job_cancelled_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'cancelled' and coalesce(old.status,'') <> 'cancelled' then
    new.cancelled_at := now();
  elsif new.status <> 'cancelled' then
    new.cancelled_at := null;
    new.cancel_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_job_cancelled_at on public.jobs;
create trigger trg_job_cancelled_at
  before insert or update of status on public.jobs
  for each row execute function public.fn_job_cancelled_at();

create index if not exists idx_jobs_scheduled_date on public.jobs(scheduled_date);
create index if not exists idx_jobs_status         on public.jobs(status);

-- ---------- SALESMEN / WORKERS ----------
-- Caktivizimi nuk fshin historine (SPEC §28).
alter table public.salesmen add column if not exists active boolean not null default true;
alter table public.workers  add column if not exists active boolean not null default true;
alter table public.workers  add column if not exists email  text;

-- ---------- INVOICES ----------
alter table public.invoices add column if not exists invoice_number text;
alter table public.invoices add column if not exists client_id   uuid references public.clients(id) on delete set null;
alter table public.invoices add column if not exists estimate_id uuid references public.estimates(id) on delete set null;

update public.invoices i
   set client_id = j.client_id
  from public.jobs j
 where i.job_id = j.id and i.client_id is null;

-- Klienti mbushet vete, njesoj si te payments.
create or replace function public.fn_invoice_fill_client()
returns trigger language plpgsql as $$
begin
  if new.client_id is null and new.job_id is not null then
    select client_id into new.client_id from public.jobs where id = new.job_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoice_fill_client on public.invoices;
create trigger trg_invoice_fill_client
  before insert or update of job_id, client_id on public.invoices
  for each row execute function public.fn_invoice_fill_client();

-- Numri i fatures: INV-2026-001, numerim me radhe brenda vitit.
create table if not exists public.invoice_counters (
  year int primary key,
  last_number int not null default 0
);

create or replace function public.fn_invoice_number()
returns trigger language plpgsql as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  if new.invoice_number is not null then
    return new;
  end if;

  -- Nese rreshti i vitit mungon, nisu nga numri me i larte i perdorur
  -- realisht — qe te mos perplaset me nje fature ekzistuese.
  insert into public.invoice_counters(year, last_number)
       values (
         y,
         coalesce((
           select max(split_part(invoice_number, '-', 3)::int)
             from public.invoices
            where invoice_number like 'INV-' || y || '-%'
         ), 0) + 1
       )
  on conflict (year) do update
       set last_number = public.invoice_counters.last_number + 1
  returning last_number into n;

  new.invoice_number := 'INV-' || y || '-' || lpad(n::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists trg_invoice_number on public.invoices;
create trigger trg_invoice_number
  before insert on public.invoices
  for each row execute function public.fn_invoice_number();

-- Numra per faturat ekzistuese, sipas rradhes se krijimit.
do $$
declare r record; y int; n int;
begin
  for r in select id, created_at from public.invoices
            where invoice_number is null order by created_at loop
    y := extract(year from r.created_at)::int;
    insert into public.invoice_counters(year, last_number) values (y, 1)
    on conflict (year) do update
      set last_number = public.invoice_counters.last_number + 1
    returning last_number into n;
    update public.invoices
       set invoice_number = 'INV-' || y || '-' || lpad(n::text, 3, '0')
     where id = r.id;
  end loop;
end $$;

alter table public.invoices drop constraint if exists invoices_number_unique;
alter table public.invoices add constraint invoices_number_unique unique (invoice_number);

-- ---------- JOB PHOTOS ----------
alter table public.job_photos add column if not exists category  text;
alter table public.job_photos add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.job_photos add column if not exists caption   text;
alter table public.job_photos alter column job_id drop not null;

alter table public.job_photos drop constraint if exists job_photos_category_check;
alter table public.job_photos add constraint job_photos_category_check
  check (category is null or category in ('before','during','after','other'));

-- Nje foto i perket ose nje pune, ose nje klienti.
alter table public.job_photos drop constraint if exists job_photos_owner;
alter table public.job_photos add constraint job_photos_owner
  check (job_id is not null or client_id is not null);

-- ---------- ESTIMATES ----------
alter table public.estimates add column if not exists job_id uuid references public.jobs(id) on delete set null;
alter table public.estimates add column if not exists notes  text;

alter table public.estimates drop constraint if exists estimates_status_check;
alter table public.estimates add constraint estimates_status_check
  check (status in ('draft','sent','approved','rejected','expired'));

-- Depozita default 40% (SPEC §11).
alter table public.estimates alter column deposit_mode  set default 'percent';
alter table public.estimates alter column deposit_value set default 40;
