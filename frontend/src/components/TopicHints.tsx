import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { TagBadge } from './Badge';

/** Topic tags spoil the approach, so keep them behind an explicit reveal. */
export function TopicHints({ tags }: { tags: string[] }) {
  const [open, setOpen] = useState(false);

  if (tags.length === 0) return null;

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-fog transition hover:bg-ink-soft hover:text-paper"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb size={13} className="text-signal" />
          {open ? 'Hide topic hints' : 'Show topic hints'}
        </span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag}>{tag}</TagBadge>
          ))}
        </div>
      )}
    </div>
  );
}
