-- ============================================================
-- Thjeshtimi i rrjedhes (kerkese e klientit, gusht 2026)
--   * Shitesi i takon KLIENTIT, jo takimit.
--   * Statuset bien nga 8 ne 5.
--   * Ofertat, faturat dhe pipeline-i dalin nga perdorimi.
-- Tabelat estimates/invoices NUK hiqen: pagesat i referohen fatures dhe
-- historiku duhet te mbetet. Thjesht nuk ka me faqe qe i krijon.
-- ============================================================

-- ---------- 1. Shitesi te klienti ----------
alter table public.clients
  add column if not exists salesman_id uuid
  references public.salesmen(id) on delete set null;

create index if not exists clients_salesman_id_idx
  on public.clients (salesman_id);

-- Merre shitesin nga puna e fundit e klientit, qe te mos humbase caktimi.
update public.clients c
set salesman_id = j.salesman_id
from (
  select distinct on (client_id) client_id, salesman_id
  from public.jobs
  where salesman_id is not null
  order by client_id, created_at desc
) j
where j.client_id = c.id and c.salesman_id is null;

-- ---------- 2. Statuset e reja ----------
-- Rreshtat ekzistues kthehen ne 'new' — statuset i vendos zyra nga e para.
update public.jobs
set status = 'new'
where status not in ('new', 'estimate_sent', 'scheduled', 'done', 'cancelled');

update public.jobs set status = 'new';

alter table public.jobs drop constraint if exists jobs_status_check;

alter table public.jobs add constraint jobs_status_check
  check (status in ('new', 'estimate_sent', 'scheduled', 'done', 'cancelled'));
