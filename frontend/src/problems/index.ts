import type { Problem } from '../lib/types';
import meta from '../data/problems-meta.json';

let cache: Problem[] | null = null;
let pending: Promise<Problem[]> | null = null;

export const PROBLEMS_META = meta;

export async function loadProblems(): Promise<Problem[]> {
  if (cache) return cache;
  if (!pending) {
    pending = fetch('/data/problems.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load problems (${response.status})`);
        return response.json() as Promise<Problem[]>;
      })
      .then((problems) => {
        cache = problems;
        return problems;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

export function getProblem(id: string): Problem | undefined {
  return cache?.find((problem) => problem.id === id);
}

export async function loadProblem(id: string): Promise<Problem | undefined> {
  const problems = await loadProblems();
  return problems.find((problem) => problem.id === id);
}
