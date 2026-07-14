import { db, type Draft, type Submission } from '../db/db';
import type { Language, RunVerdict } from './types';
import { supabase } from './supabase';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured' | 'signed-out';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

let syncState: SyncState = {
  status: supabase ? 'signed-out' : 'unconfigured',
  lastSyncedAt: null,
  error: null,
};
let syncInFlight: Promise<void> | null = null;
const listeners = new Set<SyncListener>();

function setSyncState(patch: Partial<SyncState>) {
  syncState = { ...syncState, ...patch };
  for (const listener of listeners) listener(syncState);
}

export function getSyncState(): SyncState {
  return syncState;
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(syncState);
  return () => listeners.delete(listener);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function fromIso(value: string): number {
  return new Date(value).getTime();
}

/** Full bidirectional sync: push local changes, then pull remote into IndexedDB. */
export async function syncUserData(userId: string): Promise<void> {
  if (!supabase) {
    setSyncState({ status: 'unconfigured', error: null });
    return;
  }
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    setSyncState({ status: 'syncing', error: null });
    try {
      await pushDrafts(userId);
      await pushSubmissions(userId);
      await pullDrafts(userId);
      await pullSubmissions(userId);
      setSyncState({ status: 'synced', lastSyncedAt: Date.now(), error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSyncState({ status: 'error', error: message });
      throw error;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export function markSignedOut() {
  setSyncState({ status: supabase ? 'signed-out' : 'unconfigured', error: null });
}

/** Push a single draft immediately (debounced callers should pass the latest code). */
export async function pushDraftNow(
  userId: string,
  problemId: string,
  language: Language,
  code: string,
  updatedAt: number,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('drafts').upsert(
    {
      user_id: userId,
      problem_id: problemId,
      language,
      code,
      updated_at: toIso(updatedAt),
    },
    { onConflict: 'user_id,problem_id,language' },
  );
  if (error) throw error;

  await db.drafts.update([problemId, language], { syncedAt: Date.now() });
}

/** Push one local submission if it has not been synced yet. */
export async function pushSubmissionNow(userId: string, submission: Submission): Promise<void> {
  if (!supabase || !submission.id || submission.syncedAt) return;

  const { error } = await supabase.from('submissions').upsert(
    {
      client_id: submission.clientId,
      user_id: userId,
      problem_id: submission.problemId,
      language: submission.language,
      code: submission.code,
      verdict: submission.verdict,
      passed: submission.passed,
      total: submission.total,
      time_ms: submission.timeMs,
      created_at: toIso(submission.createdAt),
    },
    { onConflict: 'user_id,client_id', ignoreDuplicates: true },
  );
  if (error) throw error;

  await db.submissions.update(submission.id, { syncedAt: Date.now() });
}

async function pushDrafts(userId: string): Promise<void> {
  if (!supabase) return;
  const drafts = await db.drafts.toArray();
  const pending = drafts.filter((draft) => !draft.syncedAt || draft.syncedAt < draft.updatedAt);
  if (pending.length === 0) return;

  const { error } = await supabase.from('drafts').upsert(
    pending.map((draft) => ({
      user_id: userId,
      problem_id: draft.problemId,
      language: draft.language,
      code: draft.code,
      updated_at: toIso(draft.updatedAt),
    })),
    { onConflict: 'user_id,problem_id,language' },
  );
  if (error) throw error;

  const now = Date.now();
  await Promise.all(pending.map((draft) => db.drafts.update([draft.problemId, draft.language], { syncedAt: now })));
}

async function pushSubmissions(userId: string): Promise<void> {
  if (!supabase) return;
  const pending = await db.submissions.filter((row) => !row.syncedAt).toArray();
  if (pending.length === 0) return;

  const { error } = await supabase.from('submissions').upsert(
    pending.map((submission) => ({
      client_id: submission.clientId,
      user_id: userId,
      problem_id: submission.problemId,
      language: submission.language,
      code: submission.code,
      verdict: submission.verdict,
      passed: submission.passed,
      total: submission.total,
      time_ms: submission.timeMs,
      created_at: toIso(submission.createdAt),
    })),
    { onConflict: 'user_id,client_id', ignoreDuplicates: true },
  );
  if (error) throw error;

  const now = Date.now();
  await Promise.all(
    pending.map(async (submission) => {
      if (submission.id != null) await db.submissions.update(submission.id, { syncedAt: now });
    }),
  );
}

async function pullDrafts(userId: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('drafts').select('*').eq('user_id', userId);
  if (error) throw error;

  for (const remote of data ?? []) {
    const key: [string, Language] = [remote.problem_id, remote.language];
    const local = await db.drafts.get(key);
    const remoteUpdatedAt = fromIso(remote.updated_at);

    if (!local || remoteUpdatedAt > local.updatedAt) {
      const next: Draft = {
        problemId: remote.problem_id,
        language: remote.language,
        code: remote.code,
        updatedAt: remoteUpdatedAt,
        syncedAt: Date.now(),
      };
      await db.drafts.put(next);
    }
  }
}

async function pullSubmissions(userId: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from('submissions').select('*').eq('user_id', userId);
  if (error) throw error;

  const existing = await db.submissions.toArray();
  const byClientId = new Map(existing.map((row) => [row.clientId, row]));

  for (const remote of data ?? []) {
    if (byClientId.has(remote.client_id)) {
      const local = byClientId.get(remote.client_id)!;
      if (local.id != null && !local.syncedAt) {
        await db.submissions.update(local.id, { syncedAt: Date.now() });
      }
      continue;
    }

    await db.submissions.add({
      clientId: remote.client_id,
      problemId: remote.problem_id,
      language: remote.language,
      code: remote.code,
      verdict: remote.verdict as RunVerdict,
      passed: remote.passed,
      total: remote.total,
      timeMs: remote.time_ms,
      createdAt: fromIso(remote.created_at),
      syncedAt: Date.now(),
    });
  }
}
