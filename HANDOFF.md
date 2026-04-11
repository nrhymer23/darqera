# Darq Era — Agent Handoff Document

> Read this fully before making any changes. This doc contains the full project context, design system, current file structure, what's built, and what needs work.

---

## 1. What This Project Is

**Site:** darqera.com
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
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (not yet deployed — local only as of handoff) |
| Fonts | Space Grotesk (headlines) + Inter (body) via next/font/google |

---

## 3. Design System — "Obsidian Architect"

The entire visual identity is built around this system. Do not deviate from it.

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#131313` | Page canvas |
| Base | `#0e0e0e` | Deepest surfaces |
| Surface Low | `#1c1b1b` | Cards |
| Surface High | `#2a2a2a` | Interactive containers |
| Surface Bright | `#3a3939` | Focus elements |
| On Surface (text) | `#e5e2e1` | All body text — never use #fff |
| Muted | `#8a8a8a` | Secondary text, dates, labels |
| Cyber Teal (brand) | `#00f0ff` | Logo, CTA, Home tab active |
| AI accent | `#a7ffb3` | Pillar A — Artificial Intelligence |
| Quantum accent | `#dbfcff` | Pillar D — Decentralized |
| Reality accent | `#fff3f9` | Pillar R — Reality/XR |
| Ghost border | `#3b494b` at 15% opacity | Subtle dividers only |

### Typography
- **Headlines/Display:** Space Grotesk, font-bold, letter-spacing `-0.02em`
- **Body/Labels:** Inter
- **Category tags:** ALL CAPS, `text-[10px]`, `tracking-widest`
- **Corner radius:** `0.125rem` (sharp) — never use `rounded-full` on structural elements

### Rules
- **No 1px borders** — use background color shifts to separate sections
- **No pure white (#fff)** — always use `#e5e2e1` for text
- **No heavy rounding** — keep edges sharp (`rounded-[0.125rem]` or none)
- **Signal Bar** — every post card has a 2px vertical left-border in its pillar accent color
- **Glassmorphism nav** — `rgba(19,19,19,0.75)` background + `blur(32px)` backdrop filter

---

## 4. File Structure

```
src/
├── app/
│   ├── globals.css          ← Design tokens, base styles
│   ├── layout.tsx           ← Root layout, font loading, Nav
│   ├── page.tsx             ← Homepage / signal feed
│   ├── a/page.tsx           ← AI pillar page
│   ├── d/page.tsx           ← Decentralized pillar page
│   ├── r/page.tsx           ← Reality pillar page
│   ├── q/page.tsx           ← Quantum pillar page
│   └── posts/[slug]/page.tsx ← Individual post view
├── components/
│   ├── Nav.tsx              ← Sticky glassmorphism nav, 5-tab structure
│   └── PostCard.tsx         ← Post card with Signal Bar accent
├── lib/
│   ├── supabase.ts          ← Supabase client (null-safe if env vars missing)
│   └── posts.ts             ← getPosts(pillar?) and getPostBySlug(slug)
└── types/
    └── post.ts              ← Post type, Pillar type, PILLAR_META config
```

---

## 5. Supabase Schema

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

## 6. Environment Variables

File: `~/projects/darqera/.env.local` (gitignored, not in repo)

```env
NEXT_PUBLIC_SUPABASE_URL=https://sadvsbduqnjywkgkevnq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_1bK5nu7QNigRMT6-w7fr1A_Slb04cNp
```

---

## 7. Navigation Structure

5-tab nav, strictly enforced:

| Tab | Route | Accent Color |
|---|---|---|
| Home | `/` | `#00f0ff` |
| D | `/d` | `#dbfcff` |
| A | `/a` | `#a7ffb3` |
| R | `/r` | `#fff3f9` |
| Q | `/q` | `#00f0ff` |

Active tab shows a 2px underline in its accent color.

---

## 8. What's Working (as of 2026-04-11)

- Build passes clean (`npm run build`)
- Homepage renders with hero section and signal feed
- Post cards render with Signal Bar, pillar tag, title, excerpt, date
- All 4 pillar pages load and filter by pillar from Supabase
- Post detail page (`/posts/[slug]`) renders full post
- Supabase connection confirmed live — test post ("Hello World") renders on homepage
- Glassmorphism nav with active tab underline indicator

---

## 9. Known CSS Issues (needs fixing)

These were visible in the last screenshot and need attention:

- **Hero subtext** (`Signal-driven coverage of...`) is barely visible — color contrast too low against the background
- **Nav tab spacing** — "A" tab appears visually close to others, may need spacing tweak
- **Post card bottom border** — the ghost divider between cards may not be rendering consistently
- **Mobile layout** — not yet tested or verified

---

## 10. Content Voice & Post Structure

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

## 11. Running Locally

```bash
cd ~/projects/darqera
npm install
npm run dev
# → http://localhost:3000
```

Make sure `.env.local` has the Supabase credentials (see Section 6).

---

## 12. Next Steps (priority order)

1. **Fix CSS issues** listed in Section 9
2. **Deploy to Vercel** — connect the GitHub repo (github.com/nrhymer23/darqera), add env vars in Vercel dashboard, point darqera.com DNS
3. **Mobile layout QA** — verify all pages on mobile viewport
4. **Push first real content** — replace the "Hello World" test post with Day 1 of the 30-day content plan
5. **SEO metadata** — add per-page OG tags and dynamic metadata for post pages
6. **ISR / revalidation** — currently set to `revalidate = 60` on all pages; verify this works on Vercel

---

## 13. Design Prototype Reference

The original design was built in Google Stitch. Key screens:
- **Home Dashboard** — dark layout, hero + signal feed cards
- **AI Topic Hub** — pillar page with filtered feed
- **Article View** — full post layout, large display headline
- **Design System doc** — `darq_signal/DESIGN.md` in the Stitch export at `~/Downloads/stitch_darq_era_blog_design/`
