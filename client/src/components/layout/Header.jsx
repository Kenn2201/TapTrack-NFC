import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop dropdown state: null | 'operator' | 'admin' | 'user'
  const [activeDropdown, setActiveDropdown] = useState(null);
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const headerRef = useRef(null);
  const drawerRef = useRef(null);

  // Close desktop dropdowns on route changes
  useEffect(() => {
    setActiveDropdown(null);
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Click outside and Escape key handler for desktop dropdowns
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);

  // Body scroll lock and focus management for mobile drawer
  useEffect(() => {
    if (mobileDrawerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleDrawerEscape = (e) => {
        if (e.key === 'Escape') setMobileDrawerOpen(false);
      };
      window.addEventListener('keydown', handleDrawerEscape);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleDrawerEscape);
      };
    }
  }, [mobileDrawerOpen]);

  const handleLogout = async () => {
    setActiveDropdown(null);
    setMobileDrawerOpen(false);
    await logout();
    navigate('/login');
  };

  const isRole = (roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Nav link style generator
  const getNavLinkClass = (path, exact = false) => {
    const active = isActive(path, exact);
    return `px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer min-h-[44px] flex items-center ${
      active
        ? 'text-cyan-400 font-semibold bg-slate-800/80 shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
    }`;
  };

  const getDropdownTriggerClass = (sectionActive, isOpen) => {
    return `px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      sectionActive
        ? 'text-cyan-400 font-semibold bg-slate-800/80'
        : isOpen
        ? 'text-white bg-slate-800/60'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
    }`;
  };

  const isOperatorSectionActive = isActive('/operator');
  const isAdminSectionActive = isActive('/admin');

  return (
    <header
      ref={headerRef}
      className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand + Compact v1.0 RC Badge */}
          <div className="flex items-center gap-2.5">
            <Link
              to={authenticated ? '/dashboard' : '/'}
              className="flex items-center gap-2.5 text-white hover:opacity-95 transition-opacity"
              aria-label="TapTrack NFC Home"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm border border-blue-400/30">
                TT
              </span>
              <span className="font-bold tracking-tight text-base sm:text-lg">
                TapTrack <span className="text-blue-400">NFC</span>
              </span>
            </Link>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 tracking-tight">
              v1.0 RC
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {authenticated ? (
              <>
                {/* 1. Dashboard */}
                <Link to="/dashboard" className={getNavLinkClass('/dashboard', true)}>
                  Dashboard
                </Link>

                {/* 2. Events */}
                <Link to="/events" className={getNavLinkClass('/events', true)}>
                  Events
                </Link>

                {/* 3. Attendance */}
                <Link to="/attendance" className={getNavLinkClass('/attendance', true)}>
                  Attendance
                </Link>

                {/* 4. Operator Dropdown (OPERATOR & ADMIN only) */}
                {isRole(['OPERATOR', 'ADMIN']) && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(activeDropdown === 'operator' ? null : 'operator')
                      }
                      aria-haspopup="true"
                      aria-expanded={activeDropdown === 'operator'}
                      className={getDropdownTriggerClass(
                        isOperatorSectionActive && !isActive('/operator/benchmark'),
                        activeDropdown === 'operator'
                      )}
                    >
                      <span>Operator</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-150 ${
                          activeDropdown === 'operator' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeDropdown === 'operator' && (
                      <div
                        role="menu"
                        className="absolute left-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <Link
                          to="/operator"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/operator', true)
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Operator Console
                        </Link>
                        <Link
                          to="/operator/nfc-reader"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/operator/nfc-reader')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          NFC Reader
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Admin Dropdown (ADMIN only) */}
                {isRole(['ADMIN']) && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(activeDropdown === 'admin' ? null : 'admin')
                      }
                      aria-haspopup="true"
                      aria-expanded={activeDropdown === 'admin'}
                      className={getDropdownTriggerClass(
                        isAdminSectionActive || isActive('/operator/benchmark'),
                        activeDropdown === 'admin'
                      )}
                    >
                      <span>Admin</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-150 ${
                          activeDropdown === 'admin' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeDropdown === 'admin' && (
                      <div
                        role="menu"
                        className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <Link
                          to="/admin"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/admin', true)
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/users"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/admin/users')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Users
                        </Link>
                        <Link
                          to="/admin/cards"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/admin/cards') || isActive('/admin/nfc-cards')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          NFC Cards
                        </Link>
                        <Link
                          to="/admin/events"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/admin/events')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Manage Events
                        </Link>
                        <Link
                          to="/admin/audit"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/admin/audit') || isActive('/admin/audits')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Audit Logs
                        </Link>
                        <Link
                          to="/operator/benchmark"
                          role="menuitem"
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive('/operator/benchmark')
                              ? 'text-cyan-400 font-semibold bg-slate-800/80'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          Benchmark
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </nav>

          {/* Right Section: Desktop User Dropdown OR Auth buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {authenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'user' ? null : 'user')
                  }
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === 'user'}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-sm font-medium transition-all hover:bg-slate-700 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeDropdown === 'user' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-xs font-bold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                  <span className="text-slate-200 text-xs sm:text-sm font-semibold max-w-[120px] truncate">
                    {user?.firstName || 'User'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {user?.role}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                      activeDropdown === 'user' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {activeDropdown === 'user' && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      Profile
                    </Link>

                    <Link
                      to="/my-card"
                      role="menuitem"
                      className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      My Card
                    </Link>

                    <Link
                      to="/attendance"
                      role="menuitem"
                      className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      Attendance History / Activity Pulse
                    </Link>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm min-h-[44px] flex items-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile top bar: Hamburger Button (>=44px touch target) */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
              className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PRIORITY 2: MOBILE APP SHELL (DRAWER) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Off-canvas Drawer Panel */}
          <aside
            ref={drawerRef}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 focus-visible:outline-none"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
                  TT
                </span>
                <span className="font-bold text-white text-sm">
                  TapTrack NFC
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  v1.0 RC
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
              {authenticated ? (
                <>
                  {/* ACCOUNT SECTION: Name & Role */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Account
                    </p>
                    <p className="font-bold text-white text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        {user?.role}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  {/* MAIN SECTION */}
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                      Main
                    </h2>
                    <div className="space-y-1">
                      <Link
                        to="/dashboard"
                        className={getNavLinkClass('/dashboard', true)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/events"
                        className={getNavLinkClass('/events', true)}
                      >
                        Events
                      </Link>
                      <Link
                        to="/attendance"
                        className={getNavLinkClass('/attendance', true)}
                      >
                        Attendance
                      </Link>
                      <Link
                        to="/my-card"
                        className={getNavLinkClass('/my-card', true)}
                      >
                        My Card
                      </Link>
                    </div>
                  </div>

                  {/* OPERATOR SECTION (if authorized) */}
                  {isRole(['OPERATOR', 'ADMIN']) && (
                    <div>
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1.5">
                        Operator
                      </h2>
                      <div className="space-y-1">
                        <Link
                          to="/operator"
                          className={getNavLinkClass('/operator', true)}
                        >
                          Operator Console
                        </Link>
                        <Link
                          to="/operator/nfc-reader"
                          className={getNavLinkClass('/operator/nfc-reader')}
                        >
                          NFC Reader
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ADMINISTRATION SECTION (if authorized) */}
                  {isRole(['ADMIN']) && (
                    <div>
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 px-2 mb-1.5">
                        Administration
                      </h2>
                      <div className="space-y-1">
                        <Link
                          to="/admin"
                          className={getNavLinkClass('/admin', true)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/users"
                          className={getNavLinkClass('/admin/users')}
                        >
                          Users
                        </Link>
                        <Link
                          to="/admin/cards"
                          className={getNavLinkClass('/admin/cards')}
                        >
                          NFC Cards
                        </Link>
                        <Link
                          to="/admin/events"
                          className={getNavLinkClass('/admin/events')}
                        >
                          Manage Events
                        </Link>
                        <Link
                          to="/admin/audit"
                          className={getNavLinkClass('/admin/audit')}
                        >
                          Audit Logs
                        </Link>
                        <Link
                          to="/operator/benchmark"
                          className={getNavLinkClass('/operator/benchmark')}
                        >
                          Benchmark
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ACCOUNT ACTIONS */}
                  <div className="pt-2 border-t border-slate-800">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                      Account
                    </h2>
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className={getNavLinkClass('/profile', true)}
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors min-h-[44px] flex items-center cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-4">
                  <Link
                    to="/login"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-center font-semibold text-slate-200 block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-blue-600 text-center font-semibold text-white block shadow-sm"
                  >
                    Register
                  </Link>
                  <Link
                    to="/compatibility"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-800 text-center text-sm font-medium text-slate-400 block"
                  >
                    Device Compatibility
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
