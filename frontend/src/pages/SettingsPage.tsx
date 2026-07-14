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
    <div className="fade-in mx-auto max-w-4xl space-y-5">
      <section className="panel px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">Settings</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-paper">Account and sync</h1>
        <p className="mt-2 max-w-2xl text-sm text-fog">
          Sign in with Supabase when you want cloud sync later. Solving, drafts, and local judging keep working offline
          without an account.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <section className="panel p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center bg-signal text-[#140d0a]">
              <UserRound size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-paper">Supabase account</h2>
              <p className="text-sm text-fog">Email/password login for this app.</p>
            </div>
          </div>

          {auth.status === 'unconfigured' && <UnconfiguredState />}
          {auth.status === 'loading' && (
            <div className="flex items-center gap-2 border border-line bg-ink p-3 text-sm text-mist">
              <Loader2 className="animate-spin text-signal" size={16} />
              Checking your saved session...
            </div>
          )}
          {auth.status === 'authenticated' && (
            <SignedInState email={auth.user?.email ?? 'Unknown email'} onSignOut={() => void auth.signOut()} />
          )}
          {auth.status === 'anonymous' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-1 bg-ink p-1">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    mode === 'signin' ? 'bg-signal text-[#140d0a]' : 'text-fog hover:bg-ink-soft hover:text-paper'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    mode === 'signup' ? 'bg-signal text-[#140d0a]' : 'text-fog hover:bg-ink-soft hover:text-paper'
                  }`}
                >
                  Create account
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-mist">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="h-10 w-full border border-line-strong bg-ink px-3 text-sm text-paper outline-none transition placeholder:text-fog/60 focus:border-signal/50"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-mist">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                  className="h-10 w-full border border-line-strong bg-ink px-3 text-sm text-paper outline-none transition placeholder:text-fog/60 focus:border-signal/50"
                  placeholder="At least 6 characters"
                />
              </label>

              {(formError || auth.error) && (
                <div className="border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{formError ?? auth.error}</div>
              )}
              {message && (
                <div className="border border-ok/40 bg-ok/10 p-3 text-sm text-ok">{message}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
            text="You can keep solving without logging in. Supabase is only contacted from Settings and future sync flows."
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
    <div className="space-y-3">
      <div className="border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
        Supabase is not configured yet. Add these variables to <code className="font-mono">frontend/.env.local</code>,
        then restart the dev server.
      </div>
      <pre className="overflow-auto border border-line bg-ink p-3 font-mono text-xs text-mist">
        VITE_SUPABASE_URL=https://your-project-ref.supabase.co{'\n'}
        VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
      </pre>
      <p className="text-sm text-fog">
        See <code className="font-mono">frontend/.env.example</code> and <code className="font-mono">supabase/README.md</code>{' '}
        for setup notes.
      </p>
    </div>
  );
}

function SignedInState({ email, onSignOut }: { email: string; onSignOut(): void }) {
  return (
    <div className="space-y-3">
      <div className="border border-ok/40 bg-ok/10 p-3">
        <div className="flex items-center gap-2 font-medium text-ok">
          <CheckCircle2 size={18} />
          Signed in
        </div>
        <p className="mt-2 break-all text-sm text-mist">{email}</p>
      </div>
      <button type="button" onClick={onSignOut} className="btn-ghost inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 grid size-9 place-items-center bg-ink-soft text-signal">{icon}</div>
      <div className="font-medium text-paper">{title}</div>
      <p className="mt-1 text-sm text-fog">{text}</p>
    </div>
  );
}
