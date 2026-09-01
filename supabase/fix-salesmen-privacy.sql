-- Nje shites nuk duhet t'i shohe koleget e vet: as emrat, as telefonat,
-- as kujt i eshte caktuar cili klient. Deri tani tabela lexohej nga te gjithe.
-- Zyra (admin/sekretare/manager) i sheh te gjithe, sic i duhen per te caktuar.
drop policy if exists "salesmen_read" on public.salesmen;

create policy "salesmen_read" on public.salesmen
  for select to authenticated
  using (
    public.is_office()
    or id = public.my_salesman_id()
  );
