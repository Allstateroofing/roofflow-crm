-- ============================================================
-- RoofFlow CRM — skema e plote
-- Projekti: qsrmrwdohezkrkekjybn
-- Kolonat jane nxjerre nga kodi (insert/select reale), jo te hamendesuara.
-- Ekzekutoje te: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- ---------- 1. PROFILES (lidhet me auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'salesman'
              check (role in ('admin','manager','secretary','salesman','worker')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- 2. TABELAT BAZE ----------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  address     text,
  zip_code    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.salesmen (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  phone              text,
  email              text,
  commission_percent numeric(5,2) default 15,
  created_at         timestamptz not null default now()
);

create table if not exists public.workers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  role        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  zip_codes   text[] not null default '{}',
  salesman_id uuid references public.salesmen(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- 3. ESTIMATES ----------
create table if not exists public.estimates (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.clients(id) on delete cascade,
  salesman_id       uuid references public.salesmen(id) on delete set null,
  title             text,
  description       text,
  items             jsonb not null default '[]'::jsonb,
  total             numeric(12,2) default 0,
  deposit_mode      text,
  deposit_value     numeric(12,2) default 0,
  deposit_amount    numeric(12,2) default 0,
  paid_amount       numeric(12,2) default 0,
  remaining_amount  numeric(12,2) default 0,
  status            text default 'pending',
  converted_job_id  uuid,
  created_at        timestamptz not null default now()
);

-- ---------- 4. JOBS ----------
create table if not exists public.jobs (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid references public.clients(id) on delete cascade,
  salesman_id                 uuid references public.salesmen(id) on delete set null,
  estimate_id                 uuid references public.estimates(id) on delete set null,
  scheduled_date              date,
  scheduled_time              time,
  status                      text default 'pending',
  total_price                 numeric(12,2) default 0,
  profit                      numeric(12,2) default 0,
  notes                       text,
  salesman_commission_paid    boolean not null default false,
  salesman_commission_paid_at timestamptz,
  created_at                  timestamptz not null default now()
);

alter table public.estimates
  drop constraint if exists estimates_converted_job_id_fkey;
alter table public.estimates
  add constraint estimates_converted_job_id_fkey
  foreign key (converted_job_id) references public.jobs(id) on delete set null;

-- ---------- 5. TABELAT E LIDHURA ME JOB ----------
create table if not exists public.job_workers (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  worker_id   uuid not null references public.workers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (job_id, worker_id)
);

create table if not exists public.job_expenses (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  description  text,
  amount       numeric(12,2) not null default 0,
  type         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.job_photos (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  url         text not null,
  created_at  timestamptz not null default now()
);

-- ---------- 6. INVOICES & PAYMENTS ----------
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.jobs(id) on delete cascade,
  amount      numeric(12,2) not null default 0,
  status      text default 'unpaid',
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid references public.jobs(id) on delete cascade,
  client_id      uuid references public.clients(id) on delete set null,
  invoice_id     uuid references public.invoices(id) on delete set null,
  amount         numeric(12,2) not null default 0,
  method         text,
  payment_type   text,
  status         text default 'completed',
  deposit_mode   text,
  deposit_value  numeric(12,2),
  paid_at        timestamptz default now(),
  created_at     timestamptz not null default now()
);

-- ---------- 7. NOTIFICATIONS ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  title       text,
  message     text,
  type        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- 8. INDEKSAT ----------
create index if not exists idx_jobs_client       on public.jobs(client_id);
create index if not exists idx_jobs_salesman     on public.jobs(salesman_id);
create index if not exists idx_estimates_client  on public.estimates(client_id);
create index if not exists idx_job_workers_job   on public.job_workers(job_id);
create index if not exists idx_job_expenses_job  on public.job_expenses(job_id);
create index if not exists idx_job_photos_job    on public.job_photos(job_id);
create index if not exists idx_invoices_job      on public.invoices(job_id);
create index if not exists idx_payments_job      on public.payments(job_id);
create index if not exists idx_notifications_usr on public.notifications(user_id);

-- ---------- 9. RLS ----------
-- CRM i brendshem: cdo perdorues i loguar ka akses. Anonimet - asnje.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','clients','salesmen','workers','zones','estimates','jobs',
    'job_workers','job_expenses','job_photos','invoices','payments','notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "authenticated_all" on public.%I', t);
    execute format(
      'create policy "authenticated_all" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
