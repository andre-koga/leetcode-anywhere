# Supabase

Local config notes, SQL migrations, and schema for auth, profiles, and sync.

## Auth + profile setup

1. Create a Supabase project.
2. In `frontend/.env.local`, set:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
   ```

3. In Supabase Dashboard > Authentication > URL Configuration, add these redirect URLs:

   - `http://localhost:5173/settings`
   - your production origin plus `/settings`

4. Apply the migration in `migrations/` (SQL Editor → paste/run, or `supabase db push` if the CLI is linked).

Only the publishable key belongs in the frontend. Never expose a service-role key
or any secret key through Vite environment variables.

## Schema

| Table / object | Purpose |
| --- | --- |
| `profiles` | Public username, full name, bio, avatar URL (1:1 with `auth.users`) |
| `drafts` | Per-user, per-problem, per-language saved code |
| `submissions` | Attempt history with verdicts (`client_id` for idempotent sync) |
| `get_user_solved_problems(uuid)` | Public solved list without exposing solution code |
| Storage bucket `avatars` | Profile images under `{user_id}/…` |

RLS keeps drafts and full submissions private to the owner. Profiles are publicly
readable. Public profile pages call `get_user_solved_problems` so accepted
problem IDs are visible without leaking code.

## Sync model

Local drafts and submissions still live in IndexedDB (Dexie). When a user signs
in, the app:

1. Pushes unsynced local drafts/submissions
2. Pulls remote rows and merges (drafts: last-write-wins by `updated_at`;
   submissions: union by `client_id`)

While signed in, new drafts and submits also push opportunistically.
