import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';

const baseItems = [
  ['/dashboard', 'Dashboard', '⌂'],
  ['/events', 'Events', '◫'],
  ['/attendance', 'Attendance', '✓'],
  ['/my-card', 'My Card', '◈'],
  ['/profile', 'Profile', '●'],
];

export default function AuthenticatedShell() {
  const location = useLocation();
  const { user } = useAuth();

  const items = [...baseItems];
  if (user?.role === 'ADMIN' || user?.role === 'OPERATOR') {
    items.push(['/operator', 'Operate', '⌁']);
  }
  if (user?.role === 'ADMIN') {
    items.push(['/admin', 'Admin', '⚙']);
  }

  const active = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-slate-800 bg-slate-950/95">
          <nav aria-label="TapTrack workspace" className="sticky top-16 p-3 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            {items.map(([path, label, icon]) => (
              <Link
                key={path}
                to={path}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active(path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
            <Link
              to="/feedback"
              className={`mt-4 flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                active('/feedback')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span aria-hidden="true" className="w-5 text-center">?</span>
              <span>Help & Feedback</span>
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="TapTrack mobile workspace"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-800 bg-slate-950/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {items.slice(0, 5).map(([path, label, icon]) => (
          <Link
            key={path}
            to={path}
            className={`flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold ${
              active(path) ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <span aria-hidden="true" className="text-base leading-none">{icon}</span>
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
