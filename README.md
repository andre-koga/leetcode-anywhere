# AnyLeet

Offline-first coding practice app built with React, Vite, Tailwind, Radix UI, Dexie, and Web Workers.

## Structure

- `frontend/` - the PWA frontend.
- `supabase/` - placeholder for future Supabase migrations, edge functions, and generated types.

## Problem catalog

The seed problems were replaced with an open LeetCode catalog:

- Statements + multi-language starters: [neenza/leetcode-problems](https://github.com/neenza/leetcode-problems)
- Extra runnable tests: [newfacade/LeetCodeDataset](https://github.com/newfacade/LeetCodeDataset)

Rebuild the offline JSON with:

```bash
pnpm --filter frontend build-problems
```

This writes `frontend/public/data/problems.json` (free problems with JS/TS/Python starters). Not every problem has local tests, and LeetCode-style helpers such as `ListNode` / `TreeNode` are not fully emulated yet.

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
