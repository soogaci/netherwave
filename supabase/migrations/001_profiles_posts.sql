-- Профили пользователей
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  bio text default '',
  tags text[] default '{}',
  avatar_url text,
  followers int default 0,
  following int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Посты (лента)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('people', 'music')),
  text text,
  tags text[] default '{}',
  has_photo boolean default false,
  track text,
  artist text,
  mood text,
  cover_color text,
  created_at timestamptz default now()
);

create index posts_user_id on public.posts(user_id);
create index posts_created_at on public.posts(created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

create policy "Профили читают все"
  on public.profiles for select
  using (true);

create policy "Профиль редактирует владелец"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Посты читают все"
  on public.posts for select
  using (true);

create policy "Посты создаёт владелец"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Посты удаляет владелец"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Создаём профиль при регистрации (для magic link)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'username', 'Пользователь')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
