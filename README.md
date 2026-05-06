# Hello Kopi

A small internal web app for coordinating office kopi runs. Place an order under your name, see who else is ordering in the same 10-minute window, and the runner takes one consolidated list to the counter.

Built as a static-export Next.js PWA, hosted on GitHub Pages, backed by Supabase for orders and shared state.

## Stack

- **Next.js 14** (App Router, static export)
- **React 18** with TypeScript (strict)
- **Tailwind CSS**
- **Supabase** (Postgres + anon key, no auth)

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Visit <http://localhost:3000>. Without env vars, the app runs in "no Supabase" mode — greeting and name selection still work, but ordering is disabled and `/orders` shows *Supabase not configured*.

## Environment

Two env vars (both `NEXT_PUBLIC_`, exposed in the bundle):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → `anon` `public` key |

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql) once. This creates the five tables (`orders`, `user_favourites`, `members`, `custom_drinks`, `hidden_drinks`) and their RLS policies.
3. Copy the project URL and anon key into your `.env.local`.

If you add a member name list, populate the `members` table from the SQL editor or via the in-app `/admin` page.

## Project layout

```
src/
  app/
    page.tsx            — greeting + name selector
    order/page.tsx      — ordering flow (My Picks / Top Choice / All Drinks)
    orders/page.tsx     — live orders list with countdown
    admin/page.tsx      — soft-gated admin (orders, menu, members tabs)
    changelog/page.tsx  — release notes
    error.tsx           — route error boundary
    global-error.tsx    — layout error boundary
    components/         — Header, BrewingCup, PullToRefresh, ThemeToggle
  data/
    drinks.ts           — flat menu by category
    menu.ts             — builder bases + modifiers + Others list
    changelog.ts        — release notes data
  lib/
    supabase.ts         — Supabase client + isConfigured guard
    constants.ts        — SESSION_MS, TIMEZONE_SG (single source of truth)
    groupOrders.ts      — session-window grouping helper
    orderRef.ts         — KOP-style reference generator
  types/
    order.ts            — shared types
supabase/
  schema.sql            — run once in a fresh Supabase project
```

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via [`deploy.yml`](.github/workflows/deploy.yml). Pull requests trigger a build check via [`check.yml`](.github/workflows/check.yml).

The Supabase URL + anon key live as repo secrets and are injected into the build.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server on :3000 |
| `npm run build` | Production static export to `out/` |
| `npm run lint` | Next.js lint |

## Threat model

> **This app is internal-team-trusted only. It is not designed to withstand arbitrary public visitors.**

- **Row Level Security is wide open.** Every table allows anonymous select/insert/update/delete. Anyone with the public anon key — which ships in the static bundle and is therefore public — can insert fake orders, delete other people's favourites, edit the menu, etc.
- **The admin gate is a soft client-side deflection.** The SHA-256 hash of the password is in the bundle. Anyone determined can reverse it via DevTools, or simply call the destructive Supabase methods directly, bypassing the gate.

Both are deliberate trade-offs for a small-team internal tool. If hello kopi is ever opened to a wider audience, the path forward is:

1. Move to **Supabase email/password auth** with an `admin` role (and possibly a generic `member` role).
2. **Tighten RLS** to anon-read + authed-write for sensitive paths (admin destructive ops gated to `admin` role).
3. **Move the password gate server-side** via a Supabase Edge Function, or eliminate it entirely in favour of Supabase auth.

Until then: keep the GitHub Pages URL out of public-internet places, and remember anything anyone enters could be tampered with by anyone else in the office.
