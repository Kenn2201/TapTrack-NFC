import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { attendanceService } from '../services/attendanceService';
export default function AttendanceHistory() {
  const [records, setRecords] = useState([]); const [error, setError] = useState('');
  useEffect(() => { attendanceService.getHistory().then((r) => setRecords(r.records || [])).catch((e) => setError(e.message)); }, []);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-4xl p-4 sm:p-8"><h1 className="text-3xl font-bold">My attendance</h1>{error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}<div className="mt-6 space-y-3">{records.length ? records.map((record) => <article key={record.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"><div><h2 className="font-semibold">{record.event?.name || `Event ${record.eventId}`}</h2><p className="text-xs text-slate-400">{record.method.replace('_', ' ')}</p></div><time className="text-sm text-slate-400">{new Date(record.recordedAt).toLocaleString()}</time></article>) : <p className="text-slate-400">No attendance records yet.</p>}</div></main></div>;
}
