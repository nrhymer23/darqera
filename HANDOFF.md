# Darq Era — Agent Handoff Document

> Read this fully before making any changes. This doc contains the full project context, design system, current file structure, what's built, and what needs work.

---

## 1. What This Project Is

**Site:** darqera.com
**Live URL:** https://darqera.vercel.app
**Repo:** github.com/nrhymer23/darqera
**Local:** `~/projects/darqera/`

Darq Era is a signal-driven tech editorial blog covering the **DARQ framework**:
- **D** — Decentralization (protocols, DeFi, DAOs, decentralized networks)
- **A** — Artificial Intelligence (LLMs, autonomous systems, AI infrastructure)
- **R** — Reality (XR, AR, VR, extended reality)
- **Q** — Quantum Computing (quantum supremacy, cryptography, post-classical computing)

Content is generated via an automated signal pipeline: **X API → Claude Haiku scoring → Supabase → NotebookLM**. Posts are approved and published manually by pushing rows to the Supabase `posts` table with `status = 'published'`.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (with `@custom-variant dark` for class-based theme toggling) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (deployed — https://darqera.vercel.app) |
| Fonts | Space Grotesk (headlines) + Inter (body) via next/font/google |

---

## 3. Design System — "Obsidian Architect"

The entire visual identity is built around this system. Do not deviate from it.

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#131313` | Page canvas (dark) / `#f5f3f0` (light) |
| Base | `#0e0e0e` | Deepest surfaces (dark) / `#eae7e3` (light) |
| Surface Low | `#1c1b1b` | Cards (dark) / `#ffffff` (light) |
| Surface High | `#2a2a2a` | Interactive containers |
| Surface Bright | `#3a3939` | Focus elements |
| On Surface (text) | `#e5e2e1` (dark) / `#1a1a1a` (light) | All body text — never use #fff |
| Muted | `#8a8a8a` (dark) / `#888888` (light) | Secondary text, dates, labels |
| Secondary text | `#b0adab` (dark) / `#555555` (light) | Hero subtext, descriptions |
| Cyber Teal (brand) | `#00f0ff` | Logo, CTA, Home tab active |
| AI accent | `#a7ffb3` | Pillar A — Artificial Intelligence |
| Quantum accent | `#dbfcff` | Pillar D — Decentralized |
| Reality accent | `#fff3f9` | Pillar R — Reality/XR |
| Ghost border | `rgba(59,73,75,0.15)` dark / `rgba(0,0,0,0.08)` light | Subtle dividers only |

### Typography
- **Headlines/Display:** Space Grotesk, font-bold, letter-spacing `-0.02em`
- **Body/Labels:** Inter
- **Category tags:** ALL CAPS, `text-[10px]`, `tracking-widest`
- **Corner radius:** `0.125rem` (sharp) — never use `rounded-full` on structural elements

### Rules
- **No 1px borders** — use background color shifts to separate sections
- **No pure white (#fff)** — always use theme-aware CSS variables
- **No heavy rounding** — keep edges sharp (`rounded-[0.125rem]` or none)
- **Signal Bar** — every post card has a 2px vertical left-border in its pillar accent color
- **Glassmorphism nav** — backdrop-filter blur(32px) with theme-aware background
- **Use CSS variables** — all colors should reference `var(--text-primary)`, `var(--bg-card)`, etc. Never hardcode theme colors in components

---

## 4. Theme System (Light / Dark / System)

The site supports three theme modes managed by a React context:

- **`globals.css`** — Defines `:root` (light) and `.dark` (dark) CSS custom property sets using `@custom-variant dark (&:where(.dark, .dark *))` for Tailwind v4
- **`ThemeProvider.tsx`** — React context that manages theme state, persists to `localStorage` key `darqera-theme`, listens for system `prefers-color-scheme` changes, and applies/removes `.dark` class on `<html>`
- **`ThemeToggle.tsx`** — Dropdown component with Sun/Moon/Monitor icons positioned in the navbar
- **Flash prevention** — Inline `<script>` in `layout.tsx` reads localStorage before React hydration to prevent FOUC

### CSS Variable Tokens

| Variable | Purpose |
|---|---|
| `--bg-primary` | Page background |
| `--bg-secondary` | Deep surfaces |
| `--bg-card` | Card backgrounds |
| `--bg-card-hover` | Card hover state |
| `--bg-nav` | Nav background (with alpha) |
| `--bg-nav-border` | Nav bottom border |
| `--text-primary` | Main text |
| `--text-secondary` | Subtext, descriptions |
| `--text-muted` | Dates, labels |
| `--border-ghost` | Dividers |
| `--shadow-card` | Card elevation |
| `--shadow-nav` | Nav shadow |

---

## 5. File Structure

```
src/
├── app/
│   ├── globals.css          ← Design tokens, theme variables, base styles
│   ├── layout.tsx           ← Root layout, ThemeProvider, Nav, footer, SEO metadata
│   ├── page.tsx             ← Homepage / signal feed
│   ├── admin/page.tsx       ← Post management dashboard (requires auth)
│   ├── api/                 ← API routes
│   │   ├── admin/posts/route.ts ← CRUD operations for posts using service role
│   │   ├── admin/metrics/route.ts ← Admin top-level dashboard metrics
│   │   ├── webhooks/signal/route.ts ← Automated webhook for external Signal pipeline
│   │   └── views/route.ts   ← IP-based view counter increment logic
│   ├── a/page.tsx           ← AI pillar page (with SEO metadata)
│   ├── d/page.tsx           ← Decentralized pillar page (with SEO metadata)
│   ├── r/page.tsx           ← Reality pillar page (with SEO metadata)
│   ├── q/page.tsx           ← Quantum pillar page (with SEO metadata)
│   ├── tags/[tag]/page.tsx  ← Tag index to view posts filtered by a given tag
│   └── posts/[slug]/
│       ├── page.tsx         ← Individual post view (with dynamic generateMetadata)
│       └── opengraph-image.tsx ← Dynamic OG image generator
├── components/
│   ├── Nav.tsx              ← Sticky glassmorphism nav, 5-tab desktop + mobile hamburger
│   ├── PostCard.tsx         ← Post card with Signal Bar accent
│   ├── ThemeProvider.tsx    ← Light/Dark/System theme context
│   ├── ThemeToggle.tsx      ← Theme dropdown toggle (Sun/Moon/Monitor)
│   ├── ViewCounter.tsx      ← View count display and increment component
│   ├── NewsletterCapture.tsx← Email capture form
│   └── RelatedPosts.tsx     ← Displays 3 recent posts from the same pillar
├── lib/
│   ├── supabase.ts          ← Supabase client (null-safe if env vars missing)
│   ├── supabaseAdmin.ts     ← Supabase client with service role key for admin operations
│   ├── posts.ts             ← getPosts, getPostBySlug, getRelatedPosts, getPostsByTag
│   └── readingTime.ts       ← Helper for calculating WPM-based read time
└── types/
    └── post.ts              ← Post type, Pillar type, PILLAR_META config
```

---

## 6. Supabase Schema

**Table: `posts`**

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  pillar text not null check (pillar in ('D', 'A', 'R', 'Q')),
  excerpt text,
  body text,
  published_at timestamptz default now(),
  status text not null default 'draft' check (status in ('draft', 'published')),
  tags text[] default '{}'
);
```

RLS is enabled. Public users can only read rows where `status = 'published'`.

**To add a post** (use SQL Editor — the Table Editor UI has a UUID bug):
```sql
insert into posts (title, slug, pillar, excerpt, body, status)
values (
  'Post Title Here',
  'post-slug-here',
  'A',
  'One sentence excerpt.',
  'Full body content.',
  'published'
);
```

---

## 7. Environment Variables

File: `~/projects/darqera/.env.local` (gitignored, not in repo)

```env
NEXT_PUBLIC_SUPABASE_URL=https://sadvsbduqnjywkgkevnq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_1bK5nu7QNigRMT6-w7fr1A_Slb04cNp
```

These same env vars are configured in the Vercel project dashboard.

---

## 8. Navigation Structure

5-tab nav, strictly enforced:

| Tab | Route | Accent Color |
|---|---|---|
| Home | `/` | `#00f0ff` |
| D | `/d` | `#dbfcff` |
| A | `/a` | `#a7ffb3` |
| R | `/r` | `#fff3f9` |
| Q | `/q` | `#00f0ff` |

Active tab shows a 2px underline in its accent color.

**Mobile:** Nav collapses to hamburger menu below 640px. Mobile menu slides down with pillar links + full titles. Each active item has a left accent border.

---

## 9. SEO Metadata

SEO is implemented at every level:

- **Root layout:** Title template (`%s | DARQ Era`), default description, OpenGraph, Twitter card, robots directives, `metadataBase` set to `https://darqera.com`
- **Pillar pages (D, A, R, Q):** Individual `title`, `description`, OG with per-pillar URLs
- **Post detail:** Dynamic `generateMetadata()` generates title, description, OG article type with `publishedTime`, `tags`, and `section`

---

## 10. What's Working (as of 2026-04-15)

- ✅ Build passes clean (`npm run build`) — zero TypeScript/ESLint errors
- ✅ **Deployed to Vercel** at https://darqera.vercel.app
- ✅ Homepage renders with hero section and signal feed
- ✅ Post cards render with Signal Bar, pillar tag, title, excerpt, date
- ✅ All 4 pillar pages load and filter by pillar from Supabase
- ✅ Post detail page (`/posts/[slug]`) renders full post with back nav
- ✅ Supabase connection confirmed live — test post ("Hello World") renders on homepage
- ✅ Glassmorphism nav with active tab underline indicator
- ✅ **Light/Dark/System theme toggle** — persists to localStorage, prevents FOUC
- ✅ **Hero subtext contrast** — fixed (uses `var(--text-secondary)`)
- ✅ **Nav tab spacing** — fixed (gap-2)
- ✅ **Ghost dividers** — fixed (uses `var(--border-ghost)`)
- ✅ **Mobile responsive layout** — hamburger nav, responsive padding, fluid typography
- ✅ **Per-page SEO metadata** — all pillar pages + dynamic post metadata
- ✅ **Footer** with copyright line
- ✅ ISR configured — 60s revalidation on all pages (Vercel-ready)
- ✅ **Admin page** (`/admin`) — auth gate, create post form, post list, delete with confirm
- ✅ **Admin API** (`/api/admin/posts`) — GET/POST/DELETE, service role key auth
- ✅ **View counter** — `ViewCounter.tsx` + `/api/views` route, session dedup + IP rate limiting
- ✅ **Newsletter capture** — `NewsletterCapture.tsx`, writes to `subscribers` Supabase table
- ✅ **Related posts** — `RelatedPosts.tsx`, same pillar filtered, excludes current post
- ✅ **Reading time** — `readingTime.ts`, 238 WPM calculation
- ✅ **Tag Index Pages** — `/tags/[tag]` fetching posts via Postgres Array contains logic
- ✅ **Admin Metrics** — Metrics tab on the dashboard, aggregates published vs draft + total views + subscriber counts
- ✅ **Signal Webhook** — `/api/webhooks/signal` parsing NotebookLM data automatically into drafted posts
- ✅ **Local Environment** — `.env.local` keys (Admin, Supabase) successfully authenticated on the local dev server
- ✅ All above components wired into post detail page (`/posts/[slug]`)



## 11. Content Voice & Post Structure

Every post should follow this structure:
1. **Hook** (1–3 lines)
2. **Translate the topic** (plain language explanation)
3. **What's happening**
4. **Why it matters** ← most important section
5. **The Insight** — use the signature format: *"The real shift isn't ___, it's ___."*
6. **Forward Look**
7. **Closing line**

**Tone:** Confident, clear, forward-thinking. Builder's perspective — not academic, not hype.

---

## 12. Running Locally

```bash
cd ~/projects/darqera
npm install
npm run dev
# → http://localhost:3000
```

Make sure `.env.local` has the Supabase credentials (see Section 7).

---

## 13. Next Steps (priority order)

1. **Custom domain** — point `darqera.com` DNS to Vercel (Project Settings → Domains)
2. **Push first real content** — replace the "Hello World" test post with Day 1 of the 30-day content plan

---

## 14. Feature Backlog

### Content & Pipeline
- [x] Auto-post from signal pipeline — content hits Supabase, triggers a draft post automatically
- [x] NotebookLM summaries embedded in posts — surface pipeline output on the page
- [x] Tag/category filtering by DARQ pillars (D/A/R/Q)

### Reader Experience
- [x] Newsletter/email capture — Supabase table, no third-party needed
- [x] Reading time estimate on posts
- [x] Related posts section at bottom of each post

### Social & Growth
- [ ] Auto-share to X when a post publishes
- [x] Open Graph images per post — dynamic via `next/og` (critical for link previews)
- [x] View/read count per post (Supabase increment)

### Admin Page
- [x] Manual post submission and deletion
- [x] Metrics dashboard — readers, shares, etc.

### Personal Brand (TBD — not urgent)
- [ ] About page
- [ ] Now page (current projects, SRE internship, etc.)

---

## 15. Tag Taxonomy (TBD)

Tags extend beyond the 4 DARQ pillars for discoverability and SEO. Final list TBD — placeholders below.

### Confirmed Pillars (already in schema)
- `decentralization` / `D`
- `ai` / `A`
- `reality` / `R`
- `quantum` / `Q`

### Candidate Tags (to be confirmed)
> These are popular keyword categories — finalize before first content push.

**AI & Tech**
- `llm`, `machine-learning`, `automation`, `agents`, `open-source`, `infrastructure`

**Decentralization**
- `blockchain`, `defi`, `dao`, `crypto`, `web3`, `protocols`

**Reality / XR**
- `ar`, `vr`, `spatial-computing`, `metaverse`, `wearables`

**Quantum**
- `cryptography`, `post-quantum`, `quantum-hardware`, `error-correction`

**Culture & Creator**
- `creator-economy`, `internet-culture`, `social-media`, `digital-identity`

**General**
- `breaking`, `analysis`, `deep-dive`, `weekly-signal`

---

## 14. Design Prototype Reference

The original design was built in Google Stitch. Key screens:
- **Home Dashboard** — dark layout, hero + signal feed cards
- **AI Topic Hub** — pillar page with filtered feed
- **Article View** — full post layout, large display headline
- **Design System doc** — `darq_signal/DESIGN.md` in the Stitch export at `~/Downloads/stitch_darq_era_blog_design/`
