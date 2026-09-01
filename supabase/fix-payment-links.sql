-- ============================================================
-- Pagesat e krijuara nga faqja e fatures mbanin vetem invoice_id,
-- ndaj nuk shfaqeshin as te puna as te klienti. Nxirri te dyja
-- nga fatura, dhe beje kete pjese te trigger-it qe te mos perseritet.
-- ============================================================

create or replace function public.fn_payment_fill_client()
returns trigger
language plpgsql
as $$
begin
  -- Puna nga fatura, nese mungon.
  if new.job_id is null and new.invoice_id is not null then
    select job_id into new.job_id
      from public.invoices where id = new.invoice_id;
  end if;

  -- Klienti nga puna, ose direkt nga fatura.
  if new.client_id is null then
    if new.job_id is not null then
      select client_id into new.client_id
        from public.jobs where id = new.job_id;
    elsif new.invoice_id is not null then
      select client_id into new.client_id
        from public.invoices where id = new.invoice_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payment_fill_client on public.payments;

create trigger trg_payment_fill_client
  before insert or update of job_id, client_id, invoice_id on public.payments
  for each row execute function public.fn_payment_fill_client();

-- Riparo rreshtat ekzistues.
update public.payments p
   set job_id = i.job_id
  from public.invoices i
 where p.invoice_id = i.id and p.job_id is null and i.job_id is not null;

update public.payments p
   set client_id = j.client_id
  from public.jobs j
 where p.job_id = j.id and p.client_id is null;
