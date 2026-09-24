import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { attendanceService } from '../services/attendanceService';
import { eventService } from '../services/eventService';
import { cardService } from '../services/cardService';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import NFCCard from '../components/cards/NFCCard';
import ActivityPulse from '../components/metrics/ActivityPulse';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  // Data states
  const [activityPulse, setActivityPulse] = useState(null);
  const [events, setEvents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [card, setCard] = useState(undefined); // undefined: loading, null: none, object: card
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      attendanceService.getActivityPulse().catch(() => ({ activityPulse: null })),
      eventService.getAll().catch(() => ({ events: [] })),
      attendanceService.getHistory().catch(() => ({ records: [] })),
      cardService.getMyCard().catch(() => ({ card: null })),
    ]).then(([pulseRes, eventsRes, attendanceRes, cardRes]) => {
      if (!mounted) return;
      setActivityPulse(pulseRes.activityPulse);
      setEvents(eventsRes.events || []);
      setRecentAttendance((attendanceRes.records || []).slice(0, 5));
      setCard(cardRes.card || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(user.email);
      setResendStatus({ type: 'success', message: res.message || 'Verification link sent to your email.' });
    } catch (err) {
      setResendStatus({ type: 'error', message: err.message || 'Failed to resend verification email.' });
    } finally {
      setResending(false);
    }
  };

  const isVerified = !!user?.emailVerifiedAt;
  const firstName = user?.firstName || 'User';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        {/* Verification Alert Banner */}
        {!isVerified && (
          <div className="mb-6">
            <Alert
              type="warning"
              title="Email Verification Required"
              message="Your email address is unverified. Please check your inbox or click below to request a new verification link."
            >
              {resendStatus && (
                <p className={`mt-1 font-semibold ${resendStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resendStatus.message}
                </p>
              )}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer min-h-[38px]"
                >
                  {resending ? 'Sending link...' : 'Resend Verification Email'}
                </button>
              </div>
            </Alert>
          </div>
        )}

        {/* Welcome Header */}
        <PageHeader
          title={`Welcome back, ${firstName}`}
          description="TapTrack NFC Identity & Attendance Console"
          badge={<StatusBadge status={user?.role} />}
        />

        {/* 1. Activity Pulse */}
        <div className="mb-10">
          <ActivityPulse metrics={activityPulse} loading={loading} />
        </div>

        {/* 2. Grid: Events, Recent Attendance & My NFC Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Open / Upcoming Events & Recent Attendance */}
          <div className="lg:col-span-2 space-y-8">
            {/* Open / Upcoming Events */}
            <Section
              title="Open & Upcoming Events"
              subtitle="Events currently active or scheduled for attendance"
              actions={
                <Link
                  to="/events"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 min-h-[36px]"
                >
                  View all events &rarr;
                </Link>
              }
            >
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-32 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
                  <div className="h-32 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
                </div>
              ) : events.length === 0 ? (
                <EmptyState
                  title="No Events Scheduled"
                  description="There are currently no active or upcoming events available."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.slice(0, 4).map((evt) => (
                    <Link key={evt.id} to={`/events/${evt.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl">
                    <Card className="flex flex-col justify-between h-full transition-all group-hover:border-blue-500/40 group-hover:bg-slate-800/40">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-white text-base truncate">
                            {evt.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {evt.visibility === 'INVITE_ONLY' && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                                Required
                              </span>
                            )}
                            <StatusBadge status={evt.status} />
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {evt.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {new Date(evt.startAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-slate-400">
                          {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </Card>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            {/* Recent Attendance */}
            <Section
              title="Recent Attendance"
              subtitle="Your latest verified check-in history"
              actions={
                <Link
                  to="/attendance"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 min-h-[36px]"
                >
                  Full history &rarr;
                </Link>
              }
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
                  <div className="h-16 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
                </div>
              ) : recentAttendance.length === 0 ? (
                <EmptyState
                  title="No Attendance Records"
                  description="You have not checked into any attendance sessions yet. Tap your physical card at an event to get started."
                />
              ) : (
                <div className="space-y-3">
                  {recentAttendance.map((record) => (
                    <Card key={record.id} padding="p-4" className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {record.event?.name || `Event #${record.eventId}`}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span className="capitalize">{record.method?.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(record.recordedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Verified
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(record.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Column 3: My NFC Card Digital Credential Preview */}
          <div>
            <Section
              title="My NFC Card"
              subtitle="Physical credential metadata"
              actions={
                <Link
                  to="/my-card"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 min-h-[36px]"
                >
                  View Details &rarr;
                </Link>
              }
            >
              {loading ? (
                <div className="aspect-[1.586/1] w-full rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
              ) : card ? (
                <div className="space-y-3">
                  <NFCCard card={card} />
                  <p className="text-xs text-slate-400 text-center">
                    Hold card to compatible smartphone or reader during open session.
                  </p>
                </div>
              ) : (
                <EmptyState
                  title="No NFC Card Assigned"
                  description="Your account currently does not have an active NFC card credential. Please contact an administrator to provision an NFC card."
                />
              )}
            </Section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
