import Dexie, { type Table } from 'dexie';
import type { Language, RunVerdict } from '../lib/types';

/** Per-problem, per-language saved code. Compound key keeps one draft per pair. */
export interface Draft {
  problemId: string;
  language: Language;
  code: string;
  updatedAt: number;
  /** Set after a successful cloud upsert for the signed-in user. */
  syncedAt?: number;
}

export interface Submission {
  id?: number;
  /** Stable id used for idempotent cloud sync. */
  clientId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: RunVerdict;
  passed: number;
  total: number;
  timeMs: number;
  createdAt: number;
  /** Set after a successful cloud insert for the signed-in user. */
  syncedAt?: number;
}

export interface Setting {
  key: string;
  value: string;
}

class AppDB extends Dexie {
  drafts!: Table<Draft, [string, Language]>;
  submissions!: Table<Submission, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('offline-judge');
    // Schema mirrors Supabase tables (drafts, submissions) so sync can layer on
    // without rewriting local keys.
    this.version(1).stores({
      drafts: '[problemId+language], problemId, updatedAt',
      submissions: '++id, problemId, [problemId+language], verdict, createdAt',
      settings: 'key',
    });
    this.version(2)
      .stores({
        drafts: '[problemId+language], problemId, updatedAt, syncedAt',
        submissions: '++id, clientId, problemId, [problemId+language], verdict, createdAt, syncedAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        const rows = await tx.table('submissions').toArray();
        for (const row of rows) {
          if (!row.clientId) {
            await tx.table('submissions').update(row.id, { clientId: crypto.randomUUID() });
          }
        }
      });
  }
}

export const db = new AppDB();

export function createClientId(): string {
  return crypto.randomUUID();
}

export async function saveDraft(
  problemId: string,
  language: Language,
  code: string,
  updatedAt = Date.now(),
): Promise<void> {
  await db.drafts.put({ problemId, language, code, updatedAt });
}

export async function getDraft(problemId: string, language: Language): Promise<Draft | undefined> {
  return db.drafts.get([problemId, language]);
}

export async function getLastLanguage(): Promise<Language | undefined> {
  const row = await db.settings.get('lastLanguage');
  return row?.value as Language | undefined;
}

export async function setLastLanguage(language: Language): Promise<void> {
  await db.settings.put({ key: 'lastLanguage', value: language });
}

/** Ask the browser not to evict our storage (drafts + cached runtimes). */
export function requestPersistentStorage(): void {
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}
