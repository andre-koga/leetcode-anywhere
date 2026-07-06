import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '../lib/supabase';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setError(error.message);
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setError(null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus = !isSupabaseConfigured
      ? 'unconfigured'
      : loading
        ? 'loading'
        : user
          ? 'authenticated'
          : 'anonymous';

    return {
      status,
      user,
      session,
      error,
      async signIn(email, password) {
        if (!supabase) return { error: 'Supabase is not configured.' };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      },
      async signUp(email, password) {
        if (!supabase) return { error: 'Supabase is not configured.' };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (error) return { error: error.message };
        return { confirmationRequired: !data.session };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    };
  }, [error, loading, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
