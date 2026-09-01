-- ============================================================
-- Settings — nje rresht i vetem me te dhenat e kompanise dhe parazgjedhjet.
-- ============================================================
create table if not exists public.app_settings (
  id                 int primary key default 1 check (id = 1),
  company_name       text not null default 'All State Roofing',
  company_address    text,
  company_phone      text,
  company_email      text,
  logo_url           text,
  default_commission numeric(5,2) not null default 15,
  default_deposit    numeric(5,2) not null default 40,
  invoice_terms      text default 'Net 30',
  updated_at         timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Te gjithe e lexojne (emri i kompanise duhet per fatura),
-- vetem admini e ndryshon.
drop policy if exists "app_settings_read"  on public.app_settings;
drop policy if exists "app_settings_write" on public.app_settings;

create policy "app_settings_read" on public.app_settings
  for select to authenticated using (true);

create policy "app_settings_write" on public.app_settings
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
