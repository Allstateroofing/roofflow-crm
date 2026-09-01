-- ============================================================
-- M7 — nje shites mund t'i shenonte vete komisionet si te paguara.
--
-- RLS filtron rreshta, jo kolona, ndaj politika "jobs_update" nuk e
-- ndalonte dot. Zgjidhja: nje trigger qe rikthen vlerat e komisionit
-- kur ndryshimin e ben dikush qe nuk eshte admin.
-- ============================================================

create or replace function public.fn_guard_commission_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role (auth.uid() bosh) dhe admini lejohen.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Cdo tjeter: kolonat e komisionit mbeten si ishin.
  new.salesman_commission_paid    := old.salesman_commission_paid;
  new.salesman_commission_paid_at := old.salesman_commission_paid_at;

  -- Edhe cmimi eshte i ndjeshem: vetem zyra e ndryshon.
  if public.my_role() not in ('secretary','manager') then
    new.total_price := old.total_price;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_commission_columns on public.jobs;

create trigger trg_guard_commission_columns
  before update on public.jobs
  for each row execute function public.fn_guard_commission_columns();
