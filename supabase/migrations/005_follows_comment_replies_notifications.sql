-- Подписки (кто на кого подписан)
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index if not exists follows_following_id on public.follows(following_id);

alter table public.follows enable row level security;

drop policy if exists "Подписки читают все" on public.follows;
create policy "Подписки читают все"
  on public.follows for select using (true);

drop policy if exists "Подписку создаёт авторизованный" on public.follows;
create policy "Подписку создаёт авторизованный"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Подписку снимает владелец" on public.follows;
create policy "Подписку снимает владелец"
  on public.follows for delete using (auth.uid() = follower_id);

-- Ответы на комментарии
alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

create index if not exists post_comments_parent_id on public.post_comments(parent_id);

-- Лайки комментариев
create table if not exists public.comment_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  primary key (user_id, comment_id)
);

create index if not exists comment_likes_comment_id on public.comment_likes(comment_id);

alter table public.comment_likes enable row level security;

drop policy if exists "Лайки комментов читают все" on public.comment_likes;
create policy "Лайки комментов читают все"
  on public.comment_likes for select using (true);

drop policy if exists "Лайк коммента ставит авторизованный" on public.comment_likes;
create policy "Лайк коммента ставит авторизованный"
  on public.comment_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Лайк коммента убирает владелец" on public.comment_likes;
create policy "Лайк коммента убирает владелец"
  on public.comment_likes for delete using (auth.uid() = user_id);

-- Уведомления
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow')),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  comment_id uuid references public.post_comments(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id on public.notifications(user_id);
create index if not exists notifications_created_at on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Уведомления читает владелец" on public.notifications;
create policy "Уведомления читает владелец"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Уведомление создаёт автор действия" on public.notifications;
create policy "Уведомление создаёт автор действия"
  on public.notifications for insert with check (auth.uid() = from_user_id);

drop policy if exists "Уведомление удаляет владелец" on public.notifications;
create policy "Уведомление удаляет владелец"
  on public.notifications for delete using (auth.uid() = user_id);
