import type { Difficulty } from '../lib/types';

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  medium: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  hard: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${difficultyClasses[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export function TagBadge({ children }: { children: string }) {
  return <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{children}</span>;
}
