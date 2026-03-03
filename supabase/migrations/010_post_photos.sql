-- Фото в постах (до 5 шт, массив URL)
alter table public.posts
  add column if not exists photo_urls text[] default '{}';

-- Бакет для фото постов (путь: userId/uuid.ext)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post-images read" on storage.objects;
create policy "post-images read"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "post-images upload" on storage.objects;
create policy "post-images upload"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post-images delete" on storage.objects;
create policy "post-images delete"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
