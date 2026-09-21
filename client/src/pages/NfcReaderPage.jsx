import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Scanner from '../components/bits/Scanner';
import AttendanceResult from '../components/attendance/AttendanceResult';
import useNFC from '../hooks/useNFC';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NfcReaderPage() {
  useDocumentTitle('NFC Reader');
  const location = useLocation();
  const session = location.state?.session;

  const context = session
    ? { eventId: session.eventId, sessionId: session.id }
    : null;

  const { status, result, error, startScan, stopScan, resetScan } = useNFC(context);

  const [recentScans, setRecentScans] = useState([]);

  // Track recent scans when a new result arrives
  useEffect(() => {
    if (result && status === 'SUCCESS') {
      setRecentScans((prev) => [
        {
          id: Date.now(),
          card: result.card,
          record: result.record,
          timestamp: new Date(),
          status: 'SUCCESS',
        },
        ...prev.slice(0, 9), // Keep last 10 scans
      ]);
    } else if (error && error.code === 'DUPLICATE') {
      setRecentScans((prev) => [
        {
          id: Date.now(),
          message: 'Already recorded in this session',
          timestamp: new Date(),
          status: 'DUPLICATE',
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [result, error, status]);

  // If no session is selected
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Header />
        <PageContainer maxWidth="max-w-2xl">
          <div className="py-12 sm:py-20 text-center">
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              title="No Attendance Session Selected"
              description="Choose an open attendance session before scanning. NFC tap events must be bound to an active session to record attendance."
              action={
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/operator"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Choose Session
                  </Link>
                  <Link
                    to="/operator"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 text-slate-300 hover:text-white font-medium text-sm transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Back to Operator Console
                  </Link>
                </div>
              }
            />
          </div>
        </PageContainer>
      </div>
    );
  }

  // Active session view
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-4xl">
        {/* Top Bar: Event, Session, Open Badge & Back Button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Session #{session.id}
              </span>
              <StatusBadge status="OPEN" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {session.event?.name || `Event #${session.eventId}`}
            </h1>
          </div>

          <Link
            to="/operator"
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold min-h-[44px] inline-flex items-center justify-center transition-colors"
          >
            &larr; Switch Session
          </Link>
        </div>

        {/* Scanner Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            {/* Visual Scanner */}
            <Scanner status={status} className="mb-6" />

            {/* Status Information & Actions */}
            <div className="w-full max-w-md">
              {status === 'READY' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Scanner Ready
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mb-6">
                    Ensure NFC is enabled on your Android Chrome device, then press start.
                  </p>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-full"
                    onClick={startScan}
                  >
                    Start NFC Scanner
                  </Button>
                </div>
              )}

              {(status === 'SCANNING' || status === 'REQUESTING_PERMISSION') && (
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2 animate-pulse">
                    Scanning for TapTrack NFC Tag...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mb-6">
                    Hold an authorized physical TapTrack NFC card firmly against the back of the device.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={stopScan}
                  >
                    Stop Scanner
                  </Button>
                </div>
              )}

              {status === 'VERIFYING' && (
                <div>
                  <h3 className="text-lg font-bold text-cyan-300 mb-2">
                    Verifying Credential Token...
                  </h3>
                  <p className="text-xs text-slate-400">
                    Communicating with TapTrack security verification gateway...
                  </p>
                </div>
              )}

              {status === 'SUCCESS' && (
                <div className="space-y-4">
                  <AttendanceResult
                    type="SUCCESS"
                    card={result?.card}
                    record={result?.record}
                  />
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={resetScan}
                  >
                    Scan Next Card
                  </Button>
                </div>
              )}

              {status === 'DUPLICATE' && (
                <div className="space-y-4">
                  <AttendanceResult type="DUPLICATE" />
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={resetScan}
                  >
                    Scan Next Card
                  </Button>
                </div>
              )}

              {(status === 'ERROR' || status === 'INVALID') && error && (
                <div className="space-y-4">
                  <AttendanceResult
                    type="INVALID"
                    message={error.message || 'Card credential could not be verified.'}
                  />
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={resetScan}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {status === 'UNSUPPORTED' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200 text-xs sm:text-sm leading-relaxed text-left">
                  <strong className="block text-amber-300 font-semibold mb-1">
                    Web NFC Unsupported On This Browser
                  </strong>
                  Web NFC is available on Chromium browsers on Android (Chrome 89+).
                  For Apple iOS devices, tap the card to Safari directly via the Universal URL fallback (/t).
                  Or use Manual Attendance on the Operator Console.
                </div>
              )}
            </div>
          </Card>

          {/* Recent Scans In This Session */}
          <div>
            <Card className="h-full flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Scans
                  </h3>
                  <span className="text-xs text-slate-400">
                    {recentScans.length} recorded
                  </span>
                </div>

                {recentScans.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No scans recorded yet in this session.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {recentScans.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          item.status === 'SUCCESS'
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-bold">
                            {item.card?.cardLabel || 'Card Scanned'}
                          </div>
                          <div className="text-[10px] opacity-75">
                            {item.status === 'SUCCESS' ? '✓ Checked in' : 'Duplicate scan'}
                          </div>
                        </div>
                        <span className="text-[10px] opacity-60">
                          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                In-memory scan debouncing active (1.8s)
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
