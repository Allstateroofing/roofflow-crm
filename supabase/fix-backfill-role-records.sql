-- Perdoruesit e krijuar para trigger-it mbeten pa kartele. Lidhi me nje
-- kartele ekzistuese me te njejtin emer nese ka; perndryshe krijoje.
update public.profiles p
set salesman_id = s.id
from public.salesmen s
where p.role = 'salesman'
  and p.salesman_id is null
  and lower(trim(s.name)) = lower(trim(p.full_name))
  and not exists (
    select 1 from public.profiles o
    where o.salesman_id = s.id and o.id <> p.id
  );

insert into public.salesmen (name, active)
select coalesce(nullif(trim(p.full_name), ''), 'Unnamed'), coalesce(p.active, true)
from public.profiles p
where p.role = 'salesman' and p.salesman_id is null;

update public.profiles p
set salesman_id = s.id
from public.salesmen s
where p.role = 'salesman'
  and p.salesman_id is null
  and lower(trim(s.name)) = lower(trim(p.full_name));

update public.profiles p
set worker_id = w.id
from public.workers w
where p.role = 'worker'
  and p.worker_id is null
  and lower(trim(w.name)) = lower(trim(p.full_name))
  and not exists (
    select 1 from public.profiles o
    where o.worker_id = w.id and o.id <> p.id
  );
