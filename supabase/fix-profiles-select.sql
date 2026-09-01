-- Profiles: cdo punonjes shihte emrin dhe rolin e te gjithe kolegeve.
-- Kufizoje ne ato rreshta qe aplikacioni ka vertet nevoje:
--   * rreshtin e vet (layout, useRole, requireRole)
--   * adminet (notifyAdmins te jobs/[id] futet ne notifications me id-te e tyre)
--   * gjithcka per adminin dhe manager-in (faqja Users, caktimi i ekipeve)
drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or role = 'admin'
    or public.my_role() in ('admin', 'manager')
  );
