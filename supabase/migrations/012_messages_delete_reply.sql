-- Удаление своих сообщений
drop policy if exists "Сообщения удаляет автор" on public.messages;
create policy "Сообщения удаляет автор"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);

-- Ответ на сообщение (цитируемое сообщение)
alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists reply_to_text text;
