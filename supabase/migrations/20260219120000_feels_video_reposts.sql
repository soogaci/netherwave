-- Feels: посты с видео (только для ленты Feels)
-- 1) Разрешаем type = 'feels' и добавляем video_url, description
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check check (type in ('people', 'music', 'feels'));

alter table public.posts add column if not exists video_url text;
alter table public.posts add column if not exists description text;

-- 2) Репосты филсов (кому отправил)
create table if not exists public.feel_reposts (
  id uuid primary key default gen_random_uuid(),
  feel_id uuid not null references public.posts(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists feel_reposts_from_user on public.feel_reposts(from_user_id);
create index if not exists feel_reposts_to_user on public.feel_reposts(to_user_id);
create index if not exists feel_reposts_feel_id on public.feel_reposts(feel_id);

alter table public.feel_reposts enable row level security;

drop policy if exists "feel_reposts read" on public.feel_reposts;
create policy "feel_reposts read" on public.feel_reposts for select using (true);

drop policy if exists "feel_reposts insert" on public.feel_reposts;
create policy "feel_reposts insert" on public.feel_reposts for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "feel_reposts delete" on public.feel_reposts;
create policy "feel_reposts delete" on public.feel_reposts for delete
  using (auth.uid() = from_user_id);

-- 3) Бакет для видео Feels
insert into storage.buckets (id, name, public)
values ('feel-videos', 'feel-videos', true)
on conflict (id) do nothing;

drop policy if exists "feel-videos read" on storage.objects;
create policy "feel-videos read"
  on storage.objects for select
  using (bucket_id = 'feel-videos');

drop policy if exists "feel-videos upload" on storage.objects;
create policy "feel-videos upload"
  on storage.objects for insert
  with check (
    bucket_id = 'feel-videos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "feel-videos delete" on storage.objects;
create policy "feel-videos delete"
  on storage.objects for delete
  using (
    bucket_id = 'feel-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
