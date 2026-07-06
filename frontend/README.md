# Offline Judge frontend

Vite + React + TypeScript PWA for offline coding practice.

## Stack

- React 19 and React Router
- Tailwind CSS v4
- Radix UI primitives
- CodeMirror 6 editor
- Dexie / IndexedDB for local-first drafts and submissions
- Web Workers for local execution
- Pyodide for Python 3 execution, copied into `public/pyodide`
- Vite PWA / Workbox for offline precaching

## Local commands

```bash
pnpm install
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend preview
```

`predev` and `prebuild` run `scripts/copy-pyodide.mjs`, which copies the Pyodide runtime from `node_modules` into `public/pyodide` so Python execution never depends on a CDN.
