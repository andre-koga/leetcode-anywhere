import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { displayName, getProfileByUsername, getUserSolvedProblems, initials } from '../lib/profiles';
import type { Profile } from '../lib/database.types';
import { isSupabaseConfigured } from '../lib/supabase';
import { PROBLEMS_META, loadProblems } from '../problems';
import type { Problem } from '../lib/types';

export function ProfilePage() {
  const { username } = useParams();
  const auth = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured) {
      setProfile(null);
      setError('Supabase is not configured.');
      return;
    }
    if (!username) {
      setProfile(null);
      return;
    }

    setProfile(undefined);
    setError(null);

    getProfileByUsername(username)
      .then(async (found) => {
        if (cancelled) return;
        setProfile(found);
        if (!found) {
          setSolvedIds([]);
          return;
        }
        const solves = await getUserSolvedProblems(found.id);
        if (!cancelled) setSolvedIds(solves.map((row) => row.problem_id));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProfile(null);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    loadProblems()
      .then((next) => {
        if (!cancelled) setProblems(next);
      })
      .catch(() => {
        if (!cancelled) setProblems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const solvedProblems = useMemo(() => {
    if (!problems) return [];
    const set = new Set(solvedIds);
    return problems.filter((problem) => set.has(problem.id));
  }, [problems, solvedIds]);

  if (profile === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-fog">
        <Loader2 className="animate-spin text-signal" size={16} />
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    if (error === 'Supabase is not configured.') {
      return (
        <div className="panel mx-auto max-w-lg p-4 text-sm text-fog">
          Profiles need Supabase configured. See Settings for setup notes.
        </div>
      );
    }
    return (
      <div className="panel mx-auto max-w-lg space-y-3 p-4">
        <h1 className="font-display text-xl font-bold text-paper">Profile not found</h1>
        <p className="text-sm text-fog">
          {error ?? `No user with username “${username}”.`}
        </p>
        <Link to="/" className="btn-ghost inline-flex px-3 py-1.5 text-xs font-medium">
          Back to problems
        </Link>
      </div>
    );
  }

  const isOwn = auth.user?.id === profile.id;
  const name = displayName(profile);

  return (
    <div className="fade-in mx-auto max-w-4xl space-y-5">
      <section className="panel overflow-hidden">
        <div className="h-24 bg-[linear-gradient(135deg,rgb(242_107_58_/_0.35),rgb(94_196_168_/_0.18),transparent)]" />
        <div className="relative px-4 pb-4 pt-0">
          <div className="-mt-10 mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <Avatar profile={profile} />
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold tracking-tight text-paper">{name}</h1>
                <p className="text-sm text-fog">
                  {profile.username ? `@${profile.username}` : 'No username yet'}
                </p>
              </div>
            </div>
            {isOwn && (
              <Link to="/settings" className="btn-ghost px-3 py-1.5 text-xs font-medium">
                Edit profile
              </Link>
            )}
          </div>
          {profile.bio ? (
            <p className="max-w-2xl text-sm leading-relaxed text-mist">{profile.bio}</p>
          ) : (
            <p className="text-sm text-fog">{isOwn ? 'Add a bio in Settings.' : 'No bio yet.'}</p>
          )}
        </div>
      </section>

      <section className="panel p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-paper">Solved problems</h2>
            <p className="text-xs text-fog">
              {solvedIds.length.toLocaleString()} accepted
              {PROBLEMS_META.count ? ` · ${PROBLEMS_META.count.toLocaleString()} in catalog` : ''}
            </p>
          </div>
        </div>

        {solvedProblems.length === 0 ? (
          <div className="border border-line bg-ink p-3 text-sm text-fog">
            No accepted submissions synced yet.
          </div>
        ) : (
          <div className="grid gap-1.5">
            {solvedProblems.map((problem) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className="list-row group panel flex items-center gap-2.5 px-3 py-2.5"
              >
                <CheckCircle2 className="shrink-0 text-ok" size={16} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-paper">{problem.title}</div>
                  {problem.frontendId && (
                    <div className="font-mono text-[11px] text-fog/80">#{problem.frontendId}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  const label = initials(profile);
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName(profile)}
        className="size-20 border-2 border-ink object-cover shadow-[0_0_0_1px_var(--color-line)]"
      />
    );
  }
  return (
    <div className="grid size-20 place-items-center border-2 border-ink bg-ink-soft text-lg font-semibold text-signal shadow-[0_0_0_1px_var(--color-line)]">
      {label || <UserRound size={28} />}
    </div>
  );
}
