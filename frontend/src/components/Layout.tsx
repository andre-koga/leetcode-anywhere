import { LaptopMinimal, WifiOff } from 'lucide-react';
import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-400 text-zinc-950">
              <LaptopMinimal size={20} />
            </span>
            <div>
              <div className="font-semibold tracking-tight">Offline Judge</div>
              <div className="text-xs text-zinc-400">Practice coding problems without a server</div>
            </div>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 sm:flex">
            <WifiOff size={14} />
            Code execution is fully local
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
