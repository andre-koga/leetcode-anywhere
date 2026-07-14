import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router';
import { DifficultyBadge } from '../components/Badge';
import { db } from '../db/db';
import type { Difficulty, Problem } from '../lib/types';
import { loadProblems, PROBLEMS_META } from '../problems';

const FILTERS: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];
const INTRO_DISMISSED_KEY = 'oj-intro-dismissed';

function readIntroDismissed(): boolean {
  try {
    return localStorage.getItem(INTRO_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function ProblemListPage() {
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const [query, setQuery] = useState('');
  const [introDismissed, setIntroDismissed] = useState(readIntroDismissed);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const submissions = useLiveQuery(() => db.submissions.where('verdict').equals('accepted').toArray(), []);

  useEffect(() => {
    let cancelled = false;
    loadProblems()
      .then((next) => {
        if (!cancelled) setProblems(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const solved = useMemo(() => new Set((submissions ?? []).map((s) => s.problemId)), [submissions]);
  const filtered = useMemo(() => {
    if (!problems) return [];
    const normalized = query.trim().toLowerCase();
    return problems.filter((problem) => {
      if (filter !== 'all' && problem.difficulty !== filter) return false;
      if (!normalized) return true;
      return (
        problem.title.toLowerCase().includes(normalized) ||
        problem.id.includes(normalized) ||
        (problem.frontendId ?? '').includes(normalized) ||
        problem.tags.some((tag) => tag.includes(normalized))
      );
    });
  }, [filter, problems, query]);

  function dismissIntro() {
    setIntroDismissed(true);
    try {
      localStorage.setItem(INTRO_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage failures; dismissal still lasts for this session.
    }
  }

  return (
    <div className="fade-in space-y-5">
      {!introDismissed && (
        <section className="panel relative px-4 py-3 pr-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">Local · JS · TS · Python</p>
          <h1 className="font-display mt-1 text-xl font-bold tracking-tight text-paper sm:text-2xl">
            AnyLeet keeps the grind offline.
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-fog">
            {PROBLEMS_META.count.toLocaleString()} free problems from open catalogs. Runtimes, drafts, and submissions
            stay in the browser — no judge server required.
          </p>
          <button
            type="button"
            onClick={dismissIntro}
            className="absolute right-2 top-2 rounded p-1 text-fog transition hover:bg-ink-soft hover:text-paper"
            aria-label="Dismiss intro"
          >
            <X size={14} />
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Problems</h2>
          <p className="text-xs text-fog">
            {problems
              ? `${filtered.length.toLocaleString()} shown · ${PROBLEMS_META.withTests.toLocaleString()} with local tests`
              : 'Loading catalog…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fog" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, id, tag"
              className="h-8 w-56 border border-line bg-ink py-1 pl-8 pr-2 text-xs text-paper outline-none placeholder:text-fog/60 focus:border-signal/50"
            />
          </label>
          <div className="flex gap-1">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-2.5 py-1 text-xs capitalize transition ${
                  filter === item
                    ? 'bg-signal font-semibold text-[#140d0a]'
                    : 'border border-line bg-ink-elevated text-fog hover:text-paper'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{loadError}</div>
      )}

      {!problems && !loadError && (
        <div className="flex items-center gap-2 text-sm text-fog">
          <Loader2 className="animate-spin text-signal" size={16} />
          Loading problem catalog…
        </div>
      )}

      <div className="grid gap-1.5">
        {filtered.map((problem) => (
          <Link
            key={problem.id}
            to={`/problems/${problem.id}`}
            className="list-row group panel flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {solved.has(problem.id) && <CheckCircle2 className="text-ok" size={16} />}
                {problem.frontendId && (
                  <span className="font-mono text-[11px] text-fog/80">{problem.frontendId}.</span>
                )}
                <h3 className="text-sm font-semibold text-paper">{problem.title}</h3>
                <DifficultyBadge difficulty={problem.difficulty} />
                {problem.tests.length === 0 && (
                  <span className="rounded bg-ink-soft px-1.5 py-0.5 text-[11px] text-fog">no local tests</span>
                )}
              </div>
            </div>
            <ArrowRight
              className="shrink-0 text-fog transition group-hover:translate-x-1 group-hover:text-signal"
              size={16}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
