import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router';
import { DifficultyBadge, TagBadge } from '../components/Badge';
import { db } from '../db/db';
import type { Difficulty } from '../lib/types';
import { PROBLEMS } from '../problems';

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
  const [introDismissed, setIntroDismissed] = useState(readIntroDismissed);
  const submissions = useLiveQuery(() => db.submissions.where('verdict').equals('accepted').toArray(), []);

  const solved = useMemo(() => new Set((submissions ?? []).map((s) => s.problemId)), [submissions]);
  const filtered = filter === 'all' ? PROBLEMS : PROBLEMS.filter((p) => p.difficulty === filter);

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
            Practice offline. Drafts and runtimes stay on this device.
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400">
            App shell and Pyodide are cached for offline use. Solutions are saved per problem and language.
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Problems</h2>
          <p className="text-xs text-zinc-400">{PROBLEMS.length} seed problems in the offline bundle.</p>
        </div>
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
                  <h3 className="text-sm font-semibold text-zinc-50">{problem.title}</h3>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.map((tag) => (
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
