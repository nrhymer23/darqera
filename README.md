# DARQ Era — darqera.com

Signal-driven coverage of **D**ecentralization, **A**I, **R**eality (XR), and **Q**uantum computing, written from a builder's perspective. Next.js App Router + Supabase, deployed on Vercel.

## Stack

- **Next.js 16** (App Router, RSC) · React 19 · TypeScript strict
- **Tailwind v4** with a hand-rolled CSS-variable token system (`src/app/globals.css`) — "Charged Minimalism" design system
- **Supabase** — `posts` and `subscribers` tables; schema tracked in `supabase/migrations/`
- **Vercel** — auto-deploys from `main`; Vercel Analytics

## How content flows

1. The [darq-signal-pipeline](https://github.com/nrhymer23/darq-signal-pipeline) validates topics across sources and POSTs drafts to `POST /api/webhooks/signal` (Bearer `ADMIN_SECRET_KEY`). Everything lands as `status: draft`.
2. `/admin` (key-gated) lists all posts — review, edit, then **Publish**. Publishing stamps `published_at`.
3. Public pages read only `status = 'published'` via the anon key + RLS policy.

## Key paths

- `src/app/` — routes: home feed, `/d /a /r /q` pillars, `/posts/[slug]`, `/tags/[tag]`, `/archive`, `/about`, `/admin`, `feed.xml`, `sitemap.ts`, `robots.ts`
- `src/app/api/` — `admin/posts` (CRUD + publish), `webhooks/signal` (pipeline intake), `views` (atomic counter RPC), `admin/metrics`
- `src/lib/` — `posts.ts` (queries), `adminAuth.ts` (shared admin auth), `signal.ts` (Signal Strength levels), `site.ts` (site constants)
- `src/components/` — Nav, PostCard, SignalStrength, NewsletterCapture, ThemeProvider

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build check
```

Env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_KEY`.

## Design notes

Dark-first with light mode, per-pillar accent colors, three-bar **Signal Strength** indicator (1 early / 2 emerging / 3 already shifting — set by the pipeline via `posts.signal_strength`, defaults to 2). Fonts: Space Grotesk (display) + Inter (body).
