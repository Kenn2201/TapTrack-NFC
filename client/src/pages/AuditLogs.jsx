import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { adminService } from '../services/adminService';
export default function AuditLogs() {
  const [audits, setAudits] = useState([]); const [error, setError] = useState('');
  useEffect(() => { adminService.getAudits().then((r) => setAudits(r.audits || [])).catch((e) => setError(e.message)); }, []);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-6xl p-4 sm:p-8"><h1 className="text-3xl font-bold">Audit logs</h1><p className="mt-1 text-slate-400">Read-only security and administrative history.</p>{error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}<div className="mt-6 space-y-3">{audits.map((audit) => <article key={audit.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{audit.action}</strong><time className="text-xs text-slate-400">{new Date(audit.createdAt).toLocaleString()}</time></div><p className="mt-1 text-xs text-slate-400">{audit.targetType} #{audit.targetId || '—'} · {audit.actorEmail || `Actor #${audit.actorId || 'system'}`}</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-500">{JSON.stringify(audit.metadata)}</pre></article>)}{!audits.length && !error && <p className="text-slate-400">No audit records yet.</p>}</div></main></div>;
}
