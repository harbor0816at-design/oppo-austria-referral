insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'referral-assets',
  'referral-assets',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "referral_assets_admin_insert" on storage.objects;
drop policy if exists "referral_assets_admin_update" on storage.objects;
drop policy if exists "referral_assets_admin_delete" on storage.objects;

create policy "referral_assets_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'referral-assets'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('admin','super_admin')
);

create policy "referral_assets_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'referral-assets'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('admin','super_admin')
)
with check (
  bucket_id = 'referral-assets'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('admin','super_admin')
);

create policy "referral_assets_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'referral-assets'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('admin','super_admin')
);
