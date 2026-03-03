-- Статус прочтения сообщений
alter table public.messages
  add column if not exists read_at timestamptz;

-- Разрешить обновлять сообщения (read_at) участникам DM-чата
drop policy if exists "Сообщения обновляют участники чата" on public.messages;
create policy "Сообщения обновляют участники чата"
  on public.messages for update
  to authenticated
  using (
    (chat_id like 'dm-%' and (chat_id like 'dm-' || auth.uid()::text || '_%' or chat_id like 'dm-%_' || auth.uid()::text))
    or chat_id not like 'dm-%'
  )
  with check (true);
