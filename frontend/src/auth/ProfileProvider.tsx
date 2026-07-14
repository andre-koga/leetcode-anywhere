import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ProfileContext, type ProfileContextValue } from './ProfileContext';
import type { Profile } from '../lib/database.types';
import {
  ensureProfile,
  updateProfile,
  uploadAvatar as uploadAvatarFile,
} from '../lib/profiles';
import {
  getSyncState,
  markSignedOut,
  subscribeSyncState,
  syncUserData,
  type SyncState,
} from '../lib/sync';
import { isSupabaseConfigured } from '../lib/supabase';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState>(getSyncState);

  useEffect(() => subscribeSyncState(setSync), []);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured || !auth.user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await ensureProfile(auth.user.id);
      setProfile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (auth.status === 'authenticated' && auth.user) {
      void refreshProfile();
      void syncUserData(auth.user.id).catch(() => {
        // Sync errors are surfaced via sync state.
      });
    } else {
      setProfile(null);
      setError(null);
      setLoading(false);
      markSignedOut();
    }
  }, [auth.status, auth.user, refreshProfile]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      error,
      sync,
      refreshProfile,
      async saveProfile(input) {
        if (!auth.user) return { error: 'Sign in to edit your profile.' };
        try {
          const next = await updateProfile(auth.user.id, {
            username: input.username,
            full_name: input.fullName,
            bio: input.bio,
          });
          setProfile(next);
          return {};
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      async uploadAvatar(file) {
        if (!auth.user) return { error: 'Sign in to upload an avatar.' };
        try {
          const avatarUrl = await uploadAvatarFile(auth.user.id, file);
          setProfile((current) => (current ? { ...current, avatar_url: avatarUrl } : current));
          return { avatarUrl };
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
      async syncNow() {
        if (!auth.user) return;
        await syncUserData(auth.user.id);
      },
    }),
    [auth.user, error, loading, profile, refreshProfile, sync],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
