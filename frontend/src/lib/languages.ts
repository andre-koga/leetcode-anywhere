import type { Language } from './types';

export const LANGUAGES: Record<
  Language,
  { label: string; worker: 'js' | 'py'; /** approximate warm boot cost, for UI copy */ boots: 'instant' | 'seconds' }
> = {
  javascript: { label: 'JavaScript', worker: 'js', boots: 'instant' },
  typescript: { label: 'TypeScript', worker: 'js', boots: 'instant' },
  python: { label: 'Python 3', worker: 'py', boots: 'seconds' },
};

export const LANGUAGE_IDS = Object.keys(LANGUAGES) as Language[];

export function camelToSnake(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
