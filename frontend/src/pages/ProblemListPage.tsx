import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router';
import { DifficultyBadge, TagBadge } from '../components/Badge';
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
    <div className="space-y-4">
      {!introDismissed && (
        <section className="relative rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 pr-10">
          <p className="text-[11px] font-medium text-emerald-300">JS · TS · Python · fully local execution</p>
          <h1 className="mt-0.5 text-sm font-semibold tracking-tight text-zinc-50">
            Practice offline with the open LeetCode problem catalog.
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400">
            Loaded {PROBLEMS_META.count.toLocaleString()} free problems from{' '}
            <a
              className="text-emerald-300 hover:underline"
              href="https://github.com/neenza/leetcode-problems"
              target="_blank"
              rel="noreferrer"
            >
              neenza/leetcode-problems
            </a>
            , with runnable tests merged from{' '}
            <a
              className="text-emerald-300 hover:underline"
              href="https://github.com/newfacade/LeetCodeDataset"
              target="_blank"
              rel="noreferrer"
            >
              newfacade/LeetCodeDataset
            </a>
            .
          </p>
          <button
            type="button"
            onClick={dismissIntro}
            className="absolute right-2 top-2 rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Dismiss intro"
          >
            <X size={14} />
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Problems</h2>
          <p className="text-xs text-zinc-400">
            {problems
              ? `${filtered.length.toLocaleString()} shown · ${PROBLEMS_META.withTests.toLocaleString()} with local tests`
              : 'Loading catalog…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, id, tag"
              className="h-8 w-52 rounded-md border border-zinc-800 bg-zinc-950 py-1 pl-7 pr-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>
          <div className="flex gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-2.5 py-1 text-xs capitalize transition ${
                  filter === item ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-100">{loadError}</div>
      )}

      {!problems && !loadError && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="animate-spin" size={16} />
          Loading problem catalog…
        </div>
      )}

      <div className="grid gap-2">
        {filtered.map((problem) => (
          <Link
            key={problem.id}
            to={`/problems/${problem.id}`}
            className="group rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 transition hover:border-emerald-400/50 hover:bg-zinc-900"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {solved.has(problem.id) && <CheckCircle2 className="text-emerald-300" size={16} />}
                  {problem.frontendId && <span className="text-[11px] text-zinc-500">{problem.frontendId}.</span>}
                  <h3 className="text-sm font-semibold text-zinc-50">{problem.title}</h3>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.tests.length === 0 && (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400">no local tests</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.slice(0, 6).map((tag) => (
                    <TagBadge key={tag}>{tag}</TagBadge>
                  ))}
                </div>
              </div>
              <ArrowRight className="shrink-0 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-emerald-300" size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
