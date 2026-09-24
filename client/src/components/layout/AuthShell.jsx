import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

export default function AuthShell() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <div className="mx-auto max-w-md px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1" aria-label="Authentication">
          <Link
            to="/login"
            className={`min-h-[42px] rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
              isLogin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className={`min-h-[42px] rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
              isRegister ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </Link>
        </div>
        {!isLogin && !isRegister && (
          <p className="mt-2 text-center text-xs text-slate-500">
            Secure account recovery
          </p>
        )}
      </div>
      <Outlet />
    </div>
  );
}
