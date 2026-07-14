import { Settings, UserRound, WifiOff } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { BrandMark } from './BrandMark';

export function Layout() {
  const auth = useAuth();
  const location = useLocation();
  const isProblemWorkspace = /^\/problems\/[^/]+$/.test(location.pathname);

  return (
    <div
      className={`app-shell text-paper ${
        isProblemWorkspace ? 'lg:h-dvh lg:overflow-hidden' : 'min-h-screen'
      }`}
    >
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-md">
        <div
          className={`mx-auto flex items-center justify-between gap-3 px-3 ${
            isProblemWorkspace ? 'h-10 max-w-none' : 'h-12 max-w-7xl'
          }`}
        >
          <Link to="/" className="group flex min-w-0 items-center gap-2.5">
            <BrandMark className="size-7 shrink-0 transition duration-200 group-hover:scale-[1.04] group-hover:rotate-[-3deg]" />
            <div className="min-w-0 leading-tight">
              <div className="brand-wordmark text-[15px] text-paper">AnyLeet</div>
              {!isProblemWorkspace && (
                <div className="truncate text-[11px] text-fog">Offline judge · local runtimes</div>
              )}
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-1.5">
            {!isProblemWorkspace && (
              <div className="hidden items-center gap-1.5 border border-line bg-ink-elevated px-2 py-1 text-[11px] text-fog md:flex">
                <WifiOff size={12} className="text-signal" />
                Execution stays on this device
              </div>
            )}
            {auth.status === 'authenticated' && (
              <div className="hidden max-w-40 items-center gap-1.5 border border-line bg-ink-elevated px-2 py-1 text-[11px] text-mist sm:flex">
                <UserRound size={12} className="text-ok" />
                <span className="truncate">{auth.user?.email}</span>
              </div>
            )}
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 border border-line bg-ink-elevated px-2 py-1 text-xs text-mist transition hover:border-line-strong hover:text-paper"
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
