# DARQ Era — darqera.com

Signal-driven coverage of **D**ecentralization, **A**I, **R**eality (XR), and **Q**uantum computing, written from a builder's perspective. Next.js App Router + Supabase, deployed on Vercel.

## Stack

- **Next.js 16** (App Router, RSC) · React 19 · TypeScript strict
- **Tailwind v4** with a hand-rolled CSS-variable token system (`src/app/globals.css`) — "Charged Minimalism" design system
- **Supabase** — `posts` and `subscribers` tables; schema tracked in `supabase/migrations/`
- **Vercel** — auto-deploys from `main`; Vercel Analytics

## How content flows

1. The [darq-signal-pipeline](https://github.com/nrhymer23/darq-signal-pipeline) validates topics and creates structured research packets in Darq Supabase.
2. `/admin` opens on the **Research** queue. Review evidence, sources, uncertainty, open questions, and revisions; then edit the angle, approve, reject, request more research, or retry a failed job.
3. Approval creates an immutable snapshot and dispatches the focused `draft-approved` workflow. The snapshot-aware signal webhook deduplicates delivery and always creates `status: draft`.
4. The post editor remains the only place that can publish. Publishing stamps `published_at`; public pages read only `status = 'published'` through RLS.

Darqera is the workflow system of record. Agentic OS signs server-to-server requests to the internal research API, but all state transitions, idempotency, and GitHub dispatch remain in Darqera.

## Key paths

- `src/app/` — routes: home feed, `/d /a /r /q` pillars, `/posts/[slug]`, `/tags/[tag]`, `/archive`, `/about`, `/admin`, `feed.xml`, `sitemap.ts`, `robots.ts`
- `src/app/api/` — Admin post/research APIs, signed internal research APIs, snapshot-aware signal intake, views, and metrics
- `src/lib/research/` — packet policy, canonical store, HMAC verification, actions, and focused GitHub dispatch
- `src/components/admin/` — research queue and evidence-first packet review

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build check
```

Env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_KEY`.

Research control plane server-only env:

- `DARQ_PIPELINE_GITHUB_TOKEN` — GitHub token allowed to dispatch workflows in `nrhymer23/darq-signal-pipeline`.
- `AGENTIC_OS_SHARED_SECRET` — HMAC secret shared only by the Darqera and Agentic OS server runtimes.

Neither value may use a `NEXT_PUBLIC_` prefix or appear in browser code. Every review mutation includes expected state/version and an idempotency key. Draft creation never publishes.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Design notes

Dark-first with light mode, per-pillar accent colors, three-bar **Signal Strength** indicator (1 early / 2 emerging / 3 already shifting — set by the pipeline via `posts.signal_strength`, defaults to 2). Fonts: Space Grotesk (display) + Inter (body).
