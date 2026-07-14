import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile, ProfileUpdate, SolvedProblem } from './database.types';
import { supabase } from './supabase';

export type ProfileClient = SupabaseClient<Database>;

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);
  if (!username) return 'Username is required.';
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3–30 characters: lowercase letters, numbers, or underscores.';
  }
  return null;
}

export function validateFullName(value: string): string | null {
  if (value.length > 80) return 'Full name must be 80 characters or fewer.';
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > 280) return 'Bio must be 280 characters or fewer.';
  return null;
}

function requireClient(): ProfileClient {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const client = requireClient();
  const existing = await getProfileById(userId);
  if (existing) return existing;

  const { data, error } = await client
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const client = requireClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const client = requireClient();
  const normalized = normalizeUsername(username);
  const { data, error } = await client.from('profiles').select('*').eq('username', normalized).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const client = requireClient();

  const next: ProfileUpdate = { ...patch };
  if (typeof next.username === 'string') {
    const usernameError = validateUsername(next.username);
    if (usernameError) throw new Error(usernameError);
    next.username = normalizeUsername(next.username);
  }
  if (typeof next.full_name === 'string') {
    const fullNameError = validateFullName(next.full_name);
    if (fullNameError) throw new Error(fullNameError);
    next.full_name = next.full_name.trim() || null;
  }
  if (typeof next.bio === 'string') {
    const bioError = validateBio(next.bio);
    if (bioError) throw new Error(bioError);
    next.bio = next.bio.trim() || null;
  }

  const { data, error } = await client.from('profiles').update(next).eq('id', userId).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('That username is already taken.');
    throw error;
  }
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const client = requireClient();
  if (!file.type.startsWith('image/')) throw new Error('Avatar must be an image file.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Avatar must be 2MB or smaller.');

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await client.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (uploadError) throw uploadError;

  const { data } = client.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
  await updateProfile(userId, { avatar_url: avatarUrl });
  return avatarUrl;
}

export async function getUserSolvedProblems(userId: string): Promise<SolvedProblem[]> {
  const client = requireClient();
  const { data, error } = await client.rpc('get_user_solved_problems', { profile_id: userId });
  if (error) throw error;
  return data ?? [];
}

export function displayName(profile: Profile | null | undefined, fallbackEmail?: string | null): string {
  if (profile?.full_name?.trim()) return profile.full_name.trim();
  if (profile?.username) return `@${profile.username}`;
  if (fallbackEmail) return fallbackEmail;
  return 'Coder';
}

export function initials(profile: Profile | null | undefined, fallbackEmail?: string | null): string {
  const name = displayName(profile, fallbackEmail);
  if (name.startsWith('@')) return name.slice(1, 3).toUpperCase();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
