import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const items = [
  ['/admin', 'Overview', true],
  ['/admin/users', 'Users'],
  ['/admin/cards', 'NFC Cards'],
  ['/admin/events', 'Events'],
  ['/admin/audit', 'Audit'],
  ['/admin/feedback', 'Feedback'],
  ['/admin/email', 'Email'],
  ['/admin/platform', 'Platform'],
];

export default function AdminWorkspaceNav() {
  const location = useLocation();

  const active = (path, exact) => exact
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="border-b border-slate-800 bg-slate-950/95">
      <nav
        aria-label="Administration workspace"
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8"
      >
        {items.map(([path, label, exact]) => (
          <Link
            key={path}
            to={path}
            className={`min-h-[40px] shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              active(path, exact)
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
