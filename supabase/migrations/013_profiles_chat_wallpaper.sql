-- Обои чата: URL фото пользователя для фона чата
alter table public.profiles
  add column if not exists chat_wallpaper_url text;
