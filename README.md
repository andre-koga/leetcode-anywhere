# Offline Judge

Offline-first coding practice app built with React, Vite, Tailwind, Radix UI, Dexie, and Web Workers.

## Structure

- `frontend/` - the PWA frontend.
- `supabase/` - placeholder for future Supabase migrations, edge functions, and generated types.

## MVP scope

- Languages: JavaScript, TypeScript, and Python 3.
- Per-problem and per-language saved drafts in IndexedDB.
- Local submission history in IndexedDB.
- Fully local code execution through Web Workers.
- Pyodide is self-hosted and precached for Python execution after first load.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```
