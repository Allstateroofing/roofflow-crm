-- ============================================================
-- Shitesit dhe punetoret krijohen VETEM si perdorues.
-- Me pare duheshin dy hapa: krijoje kartelen te Salesmen/Workers, pastaj
-- lidhe me llogarine. Tani kartela vjen vete kur krijohet perdoruesi, dhe
-- emri i saj ndjek emrin e perdoruesit.
-- ============================================================
create or replace function public.fn_profile_role_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(nullif(trim(new.full_name), ''), 'Unnamed');
begin
  if new.role = 'salesman' then
    if new.salesman_id is null then
      insert into public.salesmen (name, active)
      values (v_name, coalesce(new.active, true))
      returning id into new.salesman_id;
    else
      -- Emri ndjek perdoruesin, qe te mos dalin dy emra per te njejtin njeri.
      update public.salesmen
      set name = v_name, active = coalesce(new.active, true)
      where id = new.salesman_id;
    end if;
  end if;

  if new.role = 'worker' then
    if new.worker_id is null then
      insert into public.workers (name)
      values (v_name)
      returning id into new.worker_id;
    else
      update public.workers set name = v_name where id = new.worker_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profile_role_record on public.profiles;

create trigger trg_profile_role_record
  before insert or update of role, full_name, active on public.profiles
  for each row execute function public.fn_profile_role_record();
