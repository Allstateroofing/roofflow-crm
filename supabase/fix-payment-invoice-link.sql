-- ============================================================
-- Nje pagese e regjistruar te puna nuk lidhej me faturen e asaj pune,
-- ndaj fatura tregonte "paid $0" ndersa puna tregonte shumen e sakte.
--
-- Nese puna ka NJE fature te vetme, lidhja eshte e paqarte fare — bejua.
-- Nese ka disa, lere bosh: nuk mund te merret me mend cila fature paguhet.
-- ============================================================

create or replace function public.fn_payment_fill_client()
returns trigger
language plpgsql
as $$
declare
  n int;
begin
  -- Puna nga fatura.
  if new.job_id is null and new.invoice_id is not null then
    select job_id into new.job_id
      from public.invoices where id = new.invoice_id;
  end if;

  -- Fatura nga puna, vetem kur eshte nje e vetme.
  if new.invoice_id is null and new.job_id is not null then
    select count(*) into n from public.invoices where job_id = new.job_id;

    if n = 1 then
      select id into new.invoice_id
        from public.invoices where job_id = new.job_id;
    end if;
  end if;

  -- Klienti nga puna ose nga fatura.
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

-- Riparo pagesat ekzistuese qe kane pune me nje fature te vetme.
update public.payments p
   set invoice_id = i.id
  from public.invoices i
 where p.invoice_id is null
   and p.job_id = i.job_id
   and (select count(*) from public.invoices x where x.job_id = p.job_id) = 1;
