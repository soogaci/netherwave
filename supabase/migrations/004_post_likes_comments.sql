-- Лайки постов
create table if not exists public.post_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  primary key (user_id, post_id)
);

create index if not exists post_likes_post_id on public.post_likes(post_id);

-- Комментарии к постам
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  text text not null default '',
  created_at timestamptz default now()
);

create index if not exists post_comments_post_id on public.post_comments(post_id);
create index if not exists post_comments_created_at on public.post_comments(post_id, created_at);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Лайки читают все" on public.post_likes;
create policy "Лайки читают все"
  on public.post_likes for select using (true);

drop policy if exists "Лайк ставит авторизованный" on public.post_likes;
create policy "Лайк ставит авторизованный"
  on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Лайк убирает владелец" on public.post_likes;
create policy "Лайк убирает владелец"
  on public.post_likes for delete using (auth.uid() = user_id);

drop policy if exists "Комменты читают все" on public.post_comments;
create policy "Комменты читают все"
  on public.post_comments for select using (true);

drop policy if exists "Коммент создаёт авторизованный" on public.post_comments;
create policy "Коммент создаёт авторизованный"
  on public.post_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Коммент удаляет владелец" on public.post_comments;
create policy "Коммент удаляет владелец"
  on public.post_comments for delete using (auth.uid() = user_id);
