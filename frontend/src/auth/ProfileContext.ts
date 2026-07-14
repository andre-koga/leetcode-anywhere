import { createContext, useContext } from 'react';
import type { Profile } from '../lib/database.types';
import type { SyncState } from '../lib/sync';

export interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  sync: SyncState;
  refreshProfile(): Promise<void>;
  saveProfile(input: {
    username: string;
    fullName: string;
    bio: string;
  }): Promise<{ error?: string }>;
  uploadAvatar(file: File): Promise<{ error?: string; avatarUrl?: string }>;
  syncNow(): Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}
