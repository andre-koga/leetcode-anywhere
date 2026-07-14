# AnyLeet

Offline-first coding practice. Browse an open LeetCode-style catalog, write solutions in the browser, and run tests locally — no judge server required.

## What it is

AnyLeet is a PWA that keeps the whole loop on your device:

- **~2,750 free problems** loaded from open datasets (statements + JS/TS/Python starters)
- **Local judging** for problems with imported tests (Web Workers; Python via self-hosted Pyodide)
- **Per-problem, per-language drafts** and submission history in IndexedDB (Dexie)
- **Optional Supabase auth** with cloud sync for drafts/submissions, public profiles (username, name, bio, avatar), and solved lists

## Stack

| Area | Choice |
| --- | --- |
| App | React 19 + Vite + TypeScript |
| UI | Tailwind CSS v4, Radix Select, CodeMirror |
| Storage | Dexie / IndexedDB + optional Supabase sync |
| Auth / profiles | Supabase Auth, `profiles` table, avatar Storage |
| Python | Pyodide (precached by the service worker) |

## Repo layout

```
frontend/          PWA app
  public/data/     Generated problem catalog (problems.json)
  scripts/         build-leetcode-problems.mjs, copy-pyodide.mjs
supabase/          Auth + migrations for profiles, drafts, submissions, avatars
```

## Problem catalog

Sources:

- [neenza/leetcode-problems](https://github.com/neenza/leetcode-problems) — free problem statements + multi-language starters
- [newfacade/LeetCodeDataset](https://github.com/newfacade/LeetCodeDataset) — extra runnable `input_output` cases where parseable

Rebuild the offline JSON:

```bash
pnpm --filter frontend build-problems
```

Writes `frontend/public/data/problems.json`. Not every problem has local tests (unparseable I/O, missing dataset rows, linked-list/tree shapes). Helpers such as `ListNode` / `TreeNode` are not fully emulated yet.

## Setup

```bash
pnpm install
pnpm dev
```

Optional Supabase (Settings sign-in, sync, profiles):

1. Create a project at [supabase.com](https://supabase.com)
2. Copy URL + **publishable** key into `frontend/.env.local` (see `frontend/.env.example`)
3. Run the SQL in `supabase/migrations/` (Dashboard SQL Editor, or link the CLI and `supabase db push`)
4. Add redirect URL `http://localhost:5173/settings` under Auth → URL Configuration
5. Restart `pnpm dev`

After sign-in, drafts and submissions sync to your account. Edit username / name / bio / avatar on Settings; public profiles live at `/u/:username`.

Never put a service-role key in Vite env vars.

For Cursor Cloud Agents, store the same `VITE_SUPABASE_*` values in the environment **Secrets** tab so they inject at runtime.

## Commands

```bash
pnpm install
pnpm dev                 # Vite on :5173
pnpm build               # production build
pnpm lint                # oxlint
pnpm --filter frontend build-problems   # refresh catalog
```

## Product notes

- Desktop problem pages use a viewport-locked split view (statement | editor) so the page itself doesn’t scroll
- Home intro banner is dismissible and remembered in `localStorage`
- Brand: **AnyLeet** (IndexedDB database id remains `offline-judge` so existing drafts survive rebrands)
