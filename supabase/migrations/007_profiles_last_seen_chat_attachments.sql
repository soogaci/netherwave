-- Последняя активность для статуса онлайн/офлайн
alter table public.profiles
  add column if not exists last_seen timestamptz default now();

-- Бакет для вложений в чатах
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

drop policy if exists "Читают все вложения чатов" on storage.objects;
create policy "Читают все вложения чатов"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');

-- Путь файла: chatId/userId/имя → второй сегмент [2] = userId
drop policy if exists "Загружать вложения в чаты" on storage.objects;
create policy "Загружать вложения в чаты"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Удалять свои вложения чатов" on storage.objects;
create policy "Удалять свои вложения чатов"
  on storage.objects for delete
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
