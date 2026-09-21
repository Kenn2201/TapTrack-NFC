import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { adminService } from '../services/adminService';
const labels = { totalUsers: 'Total users', activeUsers: 'Active users', activeCards: 'Active cards', unassignedCards: 'Unassigned cards', lostCards: 'Lost cards', revokedCards: 'Revoked cards', disabledCards: 'Disabled cards', activeEvents: 'Active events', openSessions: 'Open sessions', attendanceToday: 'Attendance today' };
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null); const [error, setError] = useState('');
  useEffect(() => { adminService.getDashboard().then((r) => setMetrics(r.metrics)).catch((e) => setError(e.message)); }, []);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-6xl p-4 sm:p-8"><h1 className="text-3xl font-bold">Admin dashboard</h1><p className="mt-1 text-slate-400">Live operational counts from the TapTrack database.</p>{error && <p role="alert" className="mt-5 text-rose-300">{error}</p>}<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{metrics && Object.entries(labels).map(([key, label]) => <article key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-blue-300">{metrics[key]}</p></article>)}</div></main></div>;
}
