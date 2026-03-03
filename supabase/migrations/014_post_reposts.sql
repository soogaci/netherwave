-- Репосты постов (people и music)
create table if not exists public.post_reposts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, from_user_id)
);

create index if not exists post_reposts_post_id on public.post_reposts(post_id);
create index if not exists post_reposts_from_user_id on public.post_reposts(from_user_id);
create index if not exists post_reposts_created_at on public.post_reposts(created_at);

alter table public.post_reposts enable row level security;

drop policy if exists "Репосты читают все" on public.post_reposts;
create policy "Репосты читают все"
  on public.post_reposts for select using (true);

drop policy if exists "Репост создаёт авторизованный" on public.post_reposts;
create policy "Репост создаёт авторизованный"
  on public.post_reposts for insert with check (auth.uid() = from_user_id);

drop policy if exists "Репост удаляет владелец" on public.post_reposts;
create policy "Репост удаляет владелец"
  on public.post_reposts for delete using (auth.uid() = from_user_id);
