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
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { attendanceService } from '../services/attendanceService';
import { authService } from '../services/authService';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAttendanceContext from '../hooks/useAttendanceContext';

export default function Operator() {
  useDocumentTitle('Operator');

  const { context: attendanceContext, start, stop } = useAttendanceContext();

  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState({}); // { [sessionId]: userId }
  const [loading, setLoading] = useState(true);
  const [submittingSessionId, setSubmittingSessionId] = useState(null);
  const [closingSessionId, setClosingSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type, message, record, card }
  const [confirmDialog, setConfirmDialog] = useState(null);

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

  const handleCloseSession = (session) => {
    setConfirmDialog({
      title: 'Close Attendance Session',
      message: `Are you sure you want to close the attendance session for "${session.event?.name}"? Taps will no longer be accepted.`,
      variant: 'danger',
      confirmText: 'Close Session',
      onConfirm: async () => {
        setClosingSessionId(session.id);
        setFeedback(null);

        try {
          await attendanceService.closeSession(session.id);
          if (attendanceContext?.sessionId === session.id) {
            stop();
          }
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
      },
    });
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

                  {/* iPhone Attendance Mode */}
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        iPhone Attendance Mode
                      </h4>
                      <StatusBadge status={attendanceContext?.sessionId === session.id ? 'OPEN' : 'IDLE'} />
                    </div>

                    {attendanceContext?.sessionId === session.id ? (
                      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                            </span>
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                              iPhone Attendance Mode
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-blue-200/80 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded">
                            ACTIVE
                          </span>
                        </div>

                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Event</span>
                            <span className="font-semibold text-slate-200">
                              {session.event?.name || `Event #${session.eventId}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Session</span>
                            <span className="font-mono font-semibold text-slate-200">#{session.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status</span>
                            <span className="font-semibold text-emerald-400">OPEN</span>
                          </div>
                        </div>

                        <ol className="list-decimal list-inside space-y-1 text-[11px] sm:text-xs text-slate-300">
                          <li>Keep Safari signed in to TapTrack.</li>
                          <li>Tap a member's physical NFC card.</li>
                          <li>Open the NFC notification.</li>
                          <li>TapTrack records attendance automatically.</li>
                        </ol>

                        <Button
                          variant="danger"
                          size="md"
                          className="w-full"
                          onClick={() => stop()}
                        >
                          Stop iPhone Attendance Mode
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 sm:p-5">
                        <p className="text-[11px] sm:text-xs text-slate-400 mb-3 leading-relaxed">
                          Let members tap their physical cards to an iPhone. Taps record attendance into this open session automatically, with no Web NFC required.
                        </p>
                        <Button
                          variant="primary"
                          size="md"
                          disabled={session.status !== 'OPEN'}
                          onClick={() => start(session)}
                        >
                          Enable iPhone Attendance
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </PageContainer>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          loading={closingSessionId !== null}
        />
      )}
    </div>
  );
}
