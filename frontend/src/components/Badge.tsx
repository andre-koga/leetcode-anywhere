import type { Difficulty } from '../lib/types';

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'bg-ok/10 text-ok ring-ok/25',
  medium: 'bg-warn/10 text-warn ring-warn/25',
  hard: 'bg-bad/10 text-bad ring-bad/25',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ring-1 ${difficultyClasses[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export function TagBadge({ children }: { children: string }) {
  return <span className="rounded bg-ink-soft px-1.5 py-0.5 font-mono text-[10px] text-fog">{children}</span>;
}
