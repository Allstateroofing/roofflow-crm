-- Shitesi tani i takon klientit. Kur hapet nje pune e re, ajo e merr vete
-- shitesin nga klienti — ndryshe komisioni do te mbetej pa pronar dhe
-- sekretarja do te duhej ta caktonte, gje qe nuk e ka ne kompetenca.
-- Punet e vjetra nuk preken: kush e shiti, e mban.
create or replace function public.fn_job_inherit_salesman()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.salesman_id is null and new.client_id is not null then
    select c.salesman_id into new.salesman_id
    from public.clients c
    where c.id = new.client_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_job_inherit_salesman on public.jobs;

create trigger trg_job_inherit_salesman
  before insert on public.jobs
  for each row execute function public.fn_job_inherit_salesman();
