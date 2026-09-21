import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CURRENT_VERSION_LABEL } from '../../constants/version';

export default function Header() {
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link to={authenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm">
                  TT
                </span>
                <span>TapTrack <span className="text-blue-400">NFC</span></span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              {CURRENT_VERSION_LABEL}
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-4">
            {authenticated ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Profile
                </Link>
                <Link to="/events" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Events</Link>
                <Link to="/attendance" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Attendance</Link>
                <Link to="/my-card" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">My Card</Link>
                {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
                  <>
                    <Link to="/operator" className="text-amber-400 hover:text-amber-300 px-3 py-2 text-sm font-medium transition-colors">
                      Operator
                    </Link>
                    <Link to="/operator/nfc-reader" className="text-emerald-400 hover:text-emerald-300 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      NFC Reader
                    </Link>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link to="/admin" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Admin</Link>
                    <Link to="/admin/cards" className="text-blue-400 hover:text-blue-300 px-3 py-2 text-sm font-medium transition-colors">
                      NFC Cards
                    </Link>
                    <Link to="/admin/users" className="text-purple-400 hover:text-purple-300 px-3 py-2 text-sm font-medium transition-colors">
                      Admin Users
                    </Link>
                    <Link to="/admin/events" className="text-cyan-400 hover:text-cyan-300 px-3 py-2 text-sm font-medium transition-colors">Events</Link>
                    <Link to="/admin/audit" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Audits</Link>
                  </>
                )}
                <div className="h-4 w-px bg-slate-700 mx-2" />
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">
                    {user?.firstName} ({user?.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-md focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700 px-4 pt-2 pb-4 space-y-2">
          {authenticated ? (
            <>
              <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400">
                Signed in as <span className="text-white font-medium">{user?.email}</span> ({user?.role})
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700"
              >
                Profile
              </Link>
              <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700">Events</Link>
              <Link to="/attendance" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700">My Attendance</Link>
              <Link to="/my-card" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700">My NFC Card</Link>
              {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
                <>
                  <Link
                    to="/operator"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-slate-700"
                  >
                    Operator Console
                  </Link>
                  <Link
                    to="/operator/nfc-reader"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-emerald-400 hover:bg-slate-700"
                  >
                    NFC Card Reader
                  </Link>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700">Admin Dashboard</Link>
                  <Link
                    to="/admin/cards"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-slate-700"
                  >
                    NFC Card Provisioning
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:bg-slate-700"
                  >
                    Admin User Management
                  </Link>
                  <Link to="/admin/events" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-cyan-400 hover:bg-slate-700">Event Management</Link>
                  <Link to="/admin/audit" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700">Audit Logs</Link>
                </>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-slate-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
