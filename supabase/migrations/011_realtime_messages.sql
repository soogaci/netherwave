-- Включить Realtime для таблицы messages (новые сообщения приходят в реальном времени)
alter publication supabase_realtime add table public.messages;
