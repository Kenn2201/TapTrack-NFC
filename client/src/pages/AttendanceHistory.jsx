import React, { useEffect, useState } from 'react';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Alert from '../components/ui/Alert';
import { attendanceService } from '../services/attendanceService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AttendanceHistory() {
  useDocumentTitle('Attendance');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceService
      .getHistory()
      .then((r) => {
        setRecords(r.records || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load attendance history.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      <PageContainer maxWidth="max-w-5xl">
        <PageHeader
          title="Attendance History"
          description="A complete chronological log of all your verified attendance records and check-in methods."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <Section title="Recorded Check-ins" subtitle="Verified presence through NFC and operator sessions">
          {loading ? (
            <LoadingState text="Loading attendance history..." />
          ) : records.length === 0 ? (
            <EmptyState
              title="No Attendance Records Found"
              description="You have not attended any recorded sessions yet. Tap your card or present yourself to an event operator to register attendance."
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Event</th>
                      <th className="px-6 py-4">Check-in Method</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">
                            {record.event?.name || `Event #${record.eventId}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                            {record.method?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          {new Date(record.recordedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="sm:hidden space-y-3">
                {records.map((record) => (
                  <Card key={record.id} padding="p-4" className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white text-sm">
                        {record.event?.name || `Event #${record.eventId}`}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {record.method?.replace('_', ' ')}
                      </span>
                      <span>
                        {new Date(record.recordedAt).toLocaleDateString()}{' '}
                        {new Date(record.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Section>
      </PageContainer>
    </div>
  );
}
