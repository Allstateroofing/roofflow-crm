-- ============================================================
-- Statusi i pagesave: nese pagesa eshte shkruar, parat kane ardhur.
-- Nuk ka rendesi kur pastrohet ceku ne banke.
-- Kolona mbahet (fshirja do te prishte klientet ekzistues) por
-- vlera behet gjithnje 'paid' dhe hiqet nga UI.
-- ============================================================

update public.payments set status = 'paid' where status is distinct from 'paid';

alter table public.payments alter column status set default 'paid';
alter table public.payments alter column status set not null;

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status = 'paid');

comment on column public.payments.status is
  'Gjithnje ''paid'': nje rresht ketu do te thote para te marra (vendim i Amarildos, 31 gusht 2026)';
