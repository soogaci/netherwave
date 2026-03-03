-- Редактирование поста только автором
drop policy if exists "Посты редактирует владелец" on public.posts;
create policy "Посты редактирует владелец"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Редактирование комментария только автором
drop policy if exists "Коммент редактирует владелец" on public.post_comments;
create policy "Коммент редактирует владелец"
  on public.post_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
