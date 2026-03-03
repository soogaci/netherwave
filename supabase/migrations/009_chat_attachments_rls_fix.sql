-- Исправить RLS для вложений чата: путь chatId/userId/имя → проверять [2] = userId
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
