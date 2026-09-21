import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import AttendanceResult from '../components/attendance/AttendanceResult';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Operator() {
  useDocumentTitle('Operator');

  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState({}); // { [sessionId]: userId }
  const [loading, setLoading] = useState(true);
  const [submittingSessionId, setSubmittingSessionId] = useState(null);
  const [closingSessionId, setClosingSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type, message, record, card }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionsRes, usersRes] = await Promise.all([
        attendanceService.getOpenSessions(),
        authService.getUsers().catch(() => ({ users: [] })),
      ]);
      setSessions(sessionsRes.sessions || []);
      setUsers((usersRes.users || []).filter((u) => u.status === 'ACTIVE'));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load operator sessions.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualCheckIn = async (session) => {
    const userId = selectedUserIds[session.id];
    if (!userId) return;

    setSubmittingSessionId(session.id);
    setFeedback(null);

    try {
      const res = await attendanceService.recordManual({
        eventId: session.eventId,
        sessionId: session.id,
        userId: Number(userId),
      });

      setFeedback({
        type: 'SUCCESS',
        message: 'Attendance recorded successfully.',
        record: res.record,
      });

      // Clear selection
      setSelectedUserIds((prev) => ({ ...prev, [session.id]: '' }));
    } catch (err) {
      const raw = String(err.message || '');
      if (/already recorded|duplicate/i.test(raw)) {
        setFeedback({
          type: 'DUPLICATE',
          message: 'Already Recorded',
        });
      } else if (/cannot be used|invalid|revoked|disabled/i.test(raw)) {
        setFeedback({
          type: 'INVALID',
          message: 'Card Cannot Be Used',
        });
      } else {
        setFeedback({
          type: 'error',
          message: raw || 'Failed to record manual check-in.',
        });
      }
    } finally {
      setSubmittingSessionId(null);
    }
  };

  const handleCloseSession = async (session) => {
    const confirmClose = window.confirm(
      `Are you sure you want to close the attendance session for "${session.event?.name}"? Taps will no longer be accepted.`
    );
    if (!confirmClose) return;

    setClosingSessionId(session.id);
    setFeedback(null);

    try {
      await attendanceService.closeSession(session.id);
      setFeedback({
        type: 'CLOSED',
        message: 'Attendance Session Closed',
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to close attendance session.',
      });
    } finally {
      setClosingSessionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-5xl">
        <PageHeader
          title="Attendance Operations"
          description="Monitor active event sessions, scan cards with Web NFC, or record manual check-ins."
          actions={
            <Link
              to="/operator/benchmark"
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold min-h-[44px] flex items-center transition-colors"
            >
              Open Benchmark
            </Link>
          }
        />

        {feedback && (
          <div className="mb-6">
            {['SUCCESS', 'DUPLICATE', 'INVALID', 'CLOSED'].includes(feedback.type) ? (
              <AttendanceResult
                type={feedback.type}
                message={feedback.message}
                record={feedback.record}
                card={feedback.card}
              />
            ) : (
              <Alert
                type="error"
                message={feedback.message}
                onClose={() => setFeedback(null)}
              />
            )}
          </div>
        )}

        <Section
          title="Active Attendance Sessions"
          subtitle="Sessions currently accepting attendee taps and check-ins"
        >
          {loading ? (
            <LoadingState text="Loading open sessions..." />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No Open Attendance Sessions"
              description="There are currently no active sessions. An administrator or operator must open an event session before check-ins can occur."
              action={
                <Link
                  to="/admin/events"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold min-h-[44px]"
                >
                  Manage Events & Sessions
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="border-slate-800 bg-slate-900 overflow-hidden"
                >
                  {/* Session Overview Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          Current Event
                        </span>
                        <StatusBadge status={session.status} />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {session.event?.name || `Event #${session.eventId}`}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Session #{session.id} • Opened {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/operator/nfc-reader"
                        state={{ session }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-colors min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Use NFC Scanner
                      </Link>

                      <Button
                        variant="danger"
                        size="md"
                        loading={closingSessionId === session.id}
                        onClick={() => handleCloseSession(session)}
                      >
                        Close Session
                      </Button>
                    </div>
                  </div>

                  {/* Manual Attendance Entry */}
                  <div className="pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Manual Attendance Check-in
                    </h4>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1">
                        <Select
                          placeholder="Select attendee by name..."
                          value={selectedUserIds[session.id] || ''}
                          onChange={(e) =>
                            setSelectedUserIds((prev) => ({
                              ...prev,
                              [session.id]: e.target.value,
                            }))
                          }
                          options={users.map((u) => ({
                            value: String(u.id),
                            label: `${u.firstName} ${u.lastName} (${u.email})`,
                          }))}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        disabled={!selectedUserIds[session.id]}
                        loading={submittingSessionId === session.id}
                        onClick={() => handleManualCheckIn(session)}
                      >
                        Record Attendance
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </PageContainer>
    </div>
  );
}
