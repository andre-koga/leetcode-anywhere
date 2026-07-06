# Supabase

This folder is reserved for Supabase project artifacts: local config, migrations,
edge functions, and generated types.

## Auth setup

The frontend Settings page uses Supabase Auth with email/password login.

1. Create a Supabase project.
2. In `frontend/.env.local`, set:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
   ```

3. In Supabase Dashboard > Authentication > URL Configuration, add these redirect URLs:

   - `http://localhost:5173/settings`
   - your production origin plus `/settings`

Only the publishable key belongs in the frontend. Never expose a service-role key
or any secret key through Vite environment variables.

## Future sync schema

Local drafts and submissions currently live in IndexedDB via Dexie. The planned
Supabase tables should mirror that model:

- `drafts` - per user, per problem, per language saved code
- `submissions` - submission history with results

When sync is implemented, initialize the local Supabase project here with:

```bash
supabase init
```
