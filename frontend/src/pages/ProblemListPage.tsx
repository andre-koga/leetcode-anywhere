import { useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CheckCircle2, Database, DownloadCloud } from 'lucide-react';
import { Link } from 'react-router';
import { DifficultyBadge, TagBadge } from '../components/Badge';
import { db } from '../db/db';
import type { Difficulty } from '../lib/types';
import { PROBLEMS } from '../problems';

const FILTERS: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];

export function ProblemListPage() {
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  const submissions = useLiveQuery(() => db.submissions.where('verdict').equals('accepted').toArray(), []);

  const solved = useMemo(() => new Set((submissions ?? []).map((s) => s.problemId)), [submissions]);
  const filtered = filter === 'all' ? PROBLEMS : PROBLEMS.filter((p) => p.difficulty === filter);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/20 md:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-medium text-emerald-300">MVP languages: JavaScript, TypeScript, Python 3</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Solve problems anywhere, then go fully offline.</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Download the app once, cache the runtimes, and run tests locally in your browser. Drafts are saved per
            problem and per language, so your Python solution and JavaScript solution stay separate.
          </p>
        </div>
        <div className="grid gap-3">
          <InfoCard
            icon={<DownloadCloud size={20} />}
            title="Offline-first PWA"
            text="App shell, problems, and Pyodide are precached for offline use."
          />
          <InfoCard
            icon={<Database size={20} />}
            title="Local-first storage"
            text="Dexie persists drafts and submissions now; the schema maps to future Supabase sync."
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Problems</h2>
          <p className="text-sm text-zinc-400">{PROBLEMS.length} seed problems included in the offline bundle.</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${
                filter === item ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((problem) => (
          <Link
            key={problem.id}
            to={`/problems/${problem.id}`}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-emerald-400/50 hover:bg-zinc-900"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {solved.has(problem.id) && <CheckCircle2 className="text-emerald-300" size={18} />}
                  <h3 className="font-semibold text-zinc-50">{problem.title}</h3>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <TagBadge key={tag}>{tag}</TagBadge>
                  ))}
                </div>
              </div>
              <ArrowRight className="shrink-0 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-3 grid size-9 place-items-center rounded-xl bg-zinc-800 text-emerald-300">{icon}</div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-zinc-400">{text}</p>
    </div>
  );
}
