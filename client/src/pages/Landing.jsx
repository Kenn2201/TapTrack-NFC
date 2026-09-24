import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { CURRENT_VERSION_LABEL } from '../constants/version';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import DotGrid from '../components/bits/DotGrid';
import BlurText from '../components/bits/BlurText';
import FadeContent from '../components/bits/FadeContent';
import SpotlightCard from '../components/bits/SpotlightCard';

export default function Landing() {
  useDocumentTitle(); // Default title: "TapTrack-NFC"
  const { authenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-white">
      <Header />

      {/* 1. HERO SECTION */}
      <DotGrid className="pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeContent delay={50}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs sm:text-sm text-blue-300 mb-6 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{CURRENT_VERSION_LABEL}</span>
            </div>
          </FadeContent>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            <BlurText text="Tap. Verify. Attend." delay={80} />
          </h1>

          <FadeContent delay={200}>
            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              TapTrack NFC is a mobile-first NFC card provisioning and attendance
              platform designed for friction-free check-ins and cryptographic security.
            </p>

            {/* Core Capability Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                iPhone Universal NFC fallback
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Android Web NFC where supported
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Secure physical cards
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Attendance sessions
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={authenticated ? '/dashboard' : '/login'}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all duration-150 flex items-center justify-center gap-2"
              >
                <span>{authenticated ? 'Open TapTrack Console' : 'Open TapTrack'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white font-medium text-sm transition-all duration-150 flex items-center justify-center"
              >
                See How It Works
              </a>
            </div>
          </FadeContent>
        </div>
      </DotGrid>

      {/* 2. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 sm:py-28 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Workflow Lifecycle
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Provision → Tap → Verify → Attend
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              One shared attendance engine powers instantaneous, cryptographically verified check-ins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <SpotlightCard className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm mb-4">
                  01
                </div>
                <h3 className="font-bold text-white text-lg">Provision</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Administrator encodes an opaque high-entropy token URL fragment into physical NTAG cards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                /t#credential_token
              </div>
            </SpotlightCard>

            {/* Step 2 */}
            <SpotlightCard className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-sm mb-4">
                  02
                </div>
                <h3 className="font-bold text-white text-lg">Tap</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Attendee taps the card to a compatible smartphone. iPhone uses the NFC URL notification flow; compatible Android Chromium browsers can use Web NFC where available.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Universal NFC Contact
              </div>
            </SpotlightCard>

            {/* Step 3 */}
            <SpotlightCard className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black text-sm mb-4">
                  03
                </div>
                <h3 className="font-bold text-white text-lg">Verify</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Cryptographic HMAC-SHA256 hash match resolves the card state and identity without revealing token.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                HMAC-SHA256 Derivation
              </div>
            </SpotlightCard>

            {/* Step 4 */}
            <SpotlightCard className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm mb-4">
                  04
                </div>
                <h3 className="font-bold text-white text-lg">Attend</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  The active session records attendance, updates the Activity Pulse, and adds a sanitized audit-history entry.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                ✓ Recorded & Audited
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 3. FEATURE BENTO */}
      <section className="py-20 sm:py-28 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Architecture & Security
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Modern Attendance Needs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: Large */}
            <SpotlightCard className="p-6 sm:p-8 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Zero Credential URL Logging
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                  Fragment-Only URL Architecture
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xl">
                  Card credentials are strictly isolated within the URL hash fragment (#token).
                  Hash fragments are never transmitted across HTTP request headers or logged in web server
                  access logs. Client-side sanitization instantly scrubs the URL bar upon resolution.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  RFC 3986 Compliance
                </span>
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  No Browser Storage
                </span>
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  Ephemeral Memory Only
                </span>
              </div>
            </SpotlightCard>

            {/* Bento 2 */}
            <SpotlightCard className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Policy Unification
                </span>
                <h3 className="mt-2 text-lg sm:text-xl font-bold text-white">
                  Shared Attendance Engine
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Web NFC, URL fallback, and manual operator entry all invoke the exact same server-side
                  validation pipeline with duplicate protection.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold">
                Single Source of Truth
              </div>
            </SpotlightCard>

            {/* Bento 3 */}
            <SpotlightCard className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Operational Control
                </span>
                <h3 className="mt-2 text-lg sm:text-xl font-bold text-white">
                  Card Lifecycle Management
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Transition physical cards across UNASSIGNED, ACTIVE, LOST, REVOKED, REPLACED, and DISABLED states
                  with complete audit preservation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-purple-400 font-semibold">
                Non-Destructive Replacement
              </div>
            </SpotlightCard>

            {/* Bento 4: Large */}
            <SpotlightCard className="p-6 sm:p-8 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Real-Time Intelligence
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                  Activity Pulse & Audit History
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xl">
                  Attendees track total check-ins, events attended, and weekly consistency streaks.
                  Administrators inspect recursively sanitized audit logs recording every role change,
                  card revocation, and attendance record.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  Weekly Streak Tracking
                </span>
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  Sanitized Metadata
                </span>
                <span className="px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                  Zero SQL Leaks
                </span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 4. DEVICE COMPATIBILITY */}
      <section className="py-20 sm:py-28 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Universal Hardware Support
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Works Across Mobile & Desktop
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              The iPhone NFC URL flow is physically validated. Android Web NFC is implemented for compatible Chromium browsers, with physical NDEFReader acceptance still pending.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-sm mb-4">
                iOS
              </div>
              <h3 className="font-bold text-white text-lg">NFC URL (iPhone)</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tap the physical card to the phone, open the system notification, and Safari loads the secure /t credential link.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-sm mb-4">
                AND
              </div>
              <h3 className="font-bold text-white text-lg">Web NFC (Android)</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Scan the card URL in a compatible Chromium browser while signed in as an operator with an open session.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm mb-4">
                M
              </div>
              <h3 className="font-bold text-white text-lg">Manual fallback</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                An operator selects the attendee on the Operator Console when scanning is unavailable.
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-slate-500 max-w-3xl mx-auto">
            Cards store only an opaque random credential inside a TapTrack HTTPS URL. Names, emails, roles, and database IDs are never written to the card.
          </p>
        </div>
      </section>

      {/* 5. SECURITY SECTION */}
      <section className="py-20 sm:py-28 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Defense In Depth
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Cryptographic NFC Security Model
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                What Physical Tags Contain
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cards hold solely an opaque 16+ byte random token fragment in an HTTPS URL:
              </p>
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-blue-300 border border-slate-800">
                https://nfc.kenncode.me/t#sK9_2x...
              </div>
              <ul className="text-xs sm:text-sm text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> No personal names, emails, or user IDs on the tag
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> No roles or attendance records on the tag
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Never uses hardware UID as primary authentication secret
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                What the Database Stores
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                PostgreSQL only ever stores a one-way HMAC-SHA256 derivation created server-side:
              </p>
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-400 border border-slate-800">
                hmac_sha256(token, server_secret)
              </div>
              <ul className="text-xs sm:text-sm text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Raw card credentials are never stored in the database
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Zero card tokens in localStorage or sessionStorage
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> HttpOnly, SameSite, Secure session authentication
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TERMINOLOGY */}
      <section className="py-14 sm:py-16 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plain-English reference</span>
              <h2 className="mt-2 text-2xl font-bold text-white">Need a TapTrack term explained?</h2>
              <p className="mt-2 text-sm text-slate-400">
                NFC, NDEF, opaque credentials, attendance sessions, card lifecycle states, and other product terms now live on one dedicated reference page.
              </p>
            </div>
            <Link
              to="/terminology"
              className="min-h-[46px] shrink-0 inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              Open Terminology
            </Link>
          </div>
        </div>
      </section>

      {/* 7. ROLES SECTION */}
      <section className="py-20 sm:py-28 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Role-Based Access Control
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Public Demonstrations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendee */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  USER
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">Attendee</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Attendees carry their physical or digital NFC credential, view personal attendance logs, and track Activity Pulse streaks.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <li>• Personal Activity Pulse</li>
                <li>• Digital NFC card view</li>
                <li>• Attendance history</li>
              </ul>
            </div>

            {/* Operator */}
            <div className="rounded-xl border border-amber-500/30 bg-slate-900 p-6 flex flex-col justify-between shadow-lg shadow-amber-500/5">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  OPERATOR
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">Event Operator</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Front-line staff open and close attendance sessions, run the live NFC reader scanner, and handle manual check-ins.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <li>• Open & close sessions</li>
                <li>• Live NFC scanner console</li>
                <li>• Manual attendee check-in</li>
              </ul>
            </div>

            {/* Admin */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  ADMIN
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">Administrator</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Administrators provision cards, manage lifecycle states, promote roles, schedule events, and inspect sanitized audit history.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <li>• Card provisioning & lifecycle</li>
                <li>• User role promotion</li>
                <li>• Sanitized audit history</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-20 sm:py-28 border-b border-slate-800 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-slate-900/40 to-slate-950 pointer-events-none"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to experience frictionless NFC attendance?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
            Test the live demonstration today. Provision cards, scan credentials, and monitor attendance in real time.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:text-white font-medium text-sm transition-all flex items-center justify-center"
            >
              Sign In to Console
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-12 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
              TT
            </span>
            <span className="font-bold text-white text-sm">TapTrack NFC</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              {CURRENT_VERSION_LABEL}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/compatibility" className="hover:text-white transition-colors">
              Compatibility
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>

          <div className="text-center sm:text-right text-slate-500">
            <p>© {new Date().getFullYear()} TapTrack NFC Demo.</p>
            <p className="mt-0.5">Zero Credential URL Logging Architecture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
