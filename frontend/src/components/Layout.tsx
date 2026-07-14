import { LaptopMinimal, Settings, UserRound, WifiOff } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const auth = useAuth();
  const location = useLocation();
  const isProblemWorkspace = /^\/problems\/[^/]+$/.test(location.pathname);

  return (
    <div
      className={`bg-zinc-950 text-zinc-100 ${
        isProblemWorkspace ? 'lg:h-dvh lg:overflow-hidden' : 'min-h-screen'
      }`}
    >
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950">
        <div
          className={`mx-auto flex items-center justify-between gap-3 px-3 ${
            isProblemWorkspace ? 'h-10 max-w-none' : 'h-12 max-w-7xl'
          }`}
        >
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-400 text-zinc-950">
              <LaptopMinimal size={16} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold tracking-tight">AnyLeet</div>
              {!isProblemWorkspace && (
                <div className="truncate text-[11px] text-zinc-400">Practice coding problems without a server</div>
              )}
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5">
            {!isProblemWorkspace && (
              <div className="hidden items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200 md:flex">
                <WifiOff size={12} />
                Code execution is fully local
              </div>
            )}
            {auth.status === 'authenticated' && (
              <div className="hidden max-w-40 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 sm:flex">
                <UserRound size={12} className="text-emerald-300" />
                <span className="truncate">{auth.user?.email}</span>
              </div>
            )}
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
              title="Settings"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </nav>
        </div>
      </header>
      <main
        className={
          isProblemWorkspace
            ? 'lg:h-[calc(100dvh-2.5rem)] lg:overflow-hidden'
            : 'mx-auto max-w-7xl px-4 py-6'
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
