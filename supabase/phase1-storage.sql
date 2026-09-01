-- ============================================================
-- Faza 1 — Storage per fotot
-- Bucket privat: fotot e shtepive te klienteve nuk duhen publike.
-- Shfaqja behet me signed URLs.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-photos', 'job-photos', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic'];

-- Cdo perdorues i loguar sheh dhe ngarkon; fshin vetem admini.
drop policy if exists "job_photos_read"   on storage.objects;
drop policy if exists "job_photos_insert" on storage.objects;
drop policy if exists "job_photos_delete" on storage.objects;

create policy "job_photos_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'job-photos');

create policy "job_photos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'job-photos');

create policy "job_photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'job-photos' and public.is_admin());
