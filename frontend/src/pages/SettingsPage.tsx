import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Loader2, LogOut, Shield, UserRound, WifiOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type AuthMode = 'signin' | 'signup';

export function SettingsPage() {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setFormError(null);

    const result = mode === 'signin' ? await auth.signIn(email, password) : await auth.signUp(email, password);

    if (result.error) {
      setFormError(result.error);
    } else if ('confirmationRequired' in result && result.confirmationRequired) {
      setMessage('Check your email to confirm your account, then come back and sign in.');
    } else {
      setMessage(mode === 'signin' ? 'Signed in successfully.' : 'Account created and signed in.');
      setPassword('');
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <p className="mb-3 text-sm font-medium text-emerald-300">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight">Account and sync</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Sign in with Supabase here. Code execution and local drafts continue to work offline; authentication is only
          needed for future cloud sync of drafts, submissions, and progress.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-zinc-950">
              <UserRound size={20} />
            </span>
            <div>
              <h2 className="font-semibold">Supabase account</h2>
              <p className="text-sm text-zinc-400">Email/password login for this app.</p>
            </div>
          </div>

          {auth.status === 'unconfigured' && <UnconfiguredState />}
          {auth.status === 'loading' && (
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
              <Loader2 className="animate-spin text-emerald-300" size={16} />
              Checking your saved session...
            </div>
          )}
          {auth.status === 'authenticated' && (
            <SignedInState email={auth.user?.email ?? 'Unknown email'} onSignOut={() => void auth.signOut()} />
          )}
          {auth.status === 'anonymous' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-950/80 p-1">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    mode === 'signin' ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    mode === 'signup' ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  Create account
                </button>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                  className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  placeholder="At least 6 characters"
                />
              </label>

              {(formError || auth.error) && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-100">
                  {formError ?? auth.error}
                </div>
              )}
              {message && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-100">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <InfoCard
            icon={<WifiOff size={18} />}
            title="Offline stays first"
            text="You can keep solving problems without logging in. Supabase is only contacted from Settings and future sync flows."
          />
          <InfoCard
            icon={<Shield size={18} />}
            title="Public client key only"
            text="The frontend uses Supabase's publishable key. Never put service-role or secret keys in Vite env vars."
          />
        </section>
      </div>
    </div>
  );
}

function UnconfiguredState() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
        Supabase is not configured yet. Add these variables to <code>frontend/.env.local</code>, then restart the dev
        server.
      </div>
      <pre className="overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
        VITE_SUPABASE_URL=https://your-project-ref.supabase.co{'\n'}
        VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
      </pre>
      <p className="text-sm text-zinc-400">
        See <code>frontend/.env.example</code> and <code>supabase/README.md</code> for setup notes.
      </p>
    </div>
  );
}

function SignedInState({ email, onSignOut }: { email: string; onSignOut(): void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
        <div className="flex items-center gap-2 font-medium text-emerald-100">
          <CheckCircle2 size={18} />
          Signed in
        </div>
        <p className="mt-2 break-all text-sm text-zinc-300">{email}</p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="mb-3 grid size-9 place-items-center rounded-xl bg-zinc-800 text-emerald-300">{icon}</div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-zinc-400">{text}</p>
    </div>
  );
}
