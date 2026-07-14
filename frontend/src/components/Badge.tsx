import type { Difficulty } from '../lib/types';

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'bg-ok/10 text-ok ring-ok/25',
  medium: 'bg-warn/10 text-warn ring-warn/25',
  hard: 'bg-bad/10 text-bad ring-bad/25',
};

const markClasses: Record<Difficulty, string> = {
  easy: 'text-ok',
  medium: 'text-warn',
  hard: 'text-bad',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ring-1 ${difficultyClasses[difficulty]}`}>
      {difficulty}
    </span>
  );
}

/** Icon-only difficulty mark for dense lists (color + shape, no text). */
export function DifficultyMark({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center ${markClasses[difficulty]}`}
      title={difficulty}
      aria-label={difficulty}
    >
      {difficulty === 'easy' && (
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <circle cx="8" cy="8" r="5.5" fill="currentColor" />
        </svg>
      )}
      {difficulty === 'medium' && (
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <path d="M8 2.2 14.2 13.2H1.8Z" fill="currentColor" />
        </svg>
      )}
      {difficulty === 'hard' && (
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1.2" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

export function TagBadge({ children }: { children: string }) {
  return <span className="rounded bg-ink-soft px-1.5 py-0.5 font-mono text-[10px] text-fog">{children}</span>;
}
