-- Atomic view counter, callable by anon. SECURITY DEFINER so it can update
-- posts despite RLS; only increments the counter of a published post.
-- Applied to the live project 2026-07-13 (migration: increment_view_count_rpc).
create or replace function public.increment_view_count(post_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update posts
  set view_count = coalesce(view_count, 0) + 1
  where slug = post_slug and status = 'published'
  returning view_count;
$$;

revoke all on function public.increment_view_count(text) from public;
grant execute on function public.increment_view_count(text) to anon, authenticated, service_role;
