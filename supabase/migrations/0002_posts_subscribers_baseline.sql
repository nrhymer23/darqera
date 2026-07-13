-- Baseline capture of the hand-created live schema (posts, subscribers,
-- read policy) so the database is reproducible from this repo. Idempotent —
-- running against the live project is a no-op.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  pillar text not null check (pillar = any (array['D','A','R','Q'])),
  excerpt text,
  body text,
  published_at timestamptz default now(),
  status text not null default 'draft' check (status = any (array['draft','published'])),
  tags text[] default '{}',
  view_count integer default 0
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;
alter table public.subscribers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'posts'
      and policyname = 'Public can read published posts'
  ) then
    create policy "Public can read published posts"
      on public.posts for select
      using (status = 'published');
  end if;
end $$;
