import { Check, ChevronDown } from 'lucide-react';
import { Select } from 'radix-ui';
import { LANGUAGE_IDS, LANGUAGES } from '../lib/languages';
import type { Language } from '../lib/types';

export function LanguageSelect({
  value,
  onValueChange,
}: {
  value: Language;
  onValueChange(value: Language): void;
}) {
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange(next as Language)}>
      <Select.Trigger className="inline-flex h-8 min-w-36 items-center justify-between border border-line-strong bg-ink px-2.5 text-xs font-medium text-paper outline-none transition hover:border-signal/50 focus:ring-1 focus:ring-signal/40">
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden border border-line-strong bg-ink-elevated p-1 text-paper shadow-xl">
          <Select.Viewport>
            {LANGUAGE_IDS.map((language) => (
              <Select.Item
                key={language}
                value={language}
                className="relative flex cursor-pointer select-none items-center rounded px-7 py-1.5 text-xs outline-none data-[highlighted]:bg-ink-soft"
              >
                <Select.ItemText>{LANGUAGES[language].label}</Select.ItemText>
                <Select.ItemIndicator className="absolute left-2">
                  <Check size={14} className="text-signal" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
