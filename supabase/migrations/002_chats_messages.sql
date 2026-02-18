-- Сообщения в чатах (chat_id — текст: dm-1, gr-1, saved и т.д.)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_me boolean not null,
  text text default '',
  sticker text,
  attachment jsonb,
  created_at timestamptz default now()
);

create index messages_chat_id on public.messages(chat_id);
create index messages_created_at on public.messages(chat_id, created_at);

alter table public.messages enable row level security;

create policy "Сообщения читают авторизованные"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "Сообщения создаёт авторизованный"
  on public.messages for insert
  with check (auth.uid() = user_id);
