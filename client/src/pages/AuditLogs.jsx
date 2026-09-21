import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import { adminService } from '../services/adminService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function AuditLogs() {
  useDocumentTitle('Audit Logs');
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getAudits()
      .then((r) => {
        setAudits(r.audits || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load security audit logs.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-6xl">
        <PageHeader
          title="Audit Logs"
          description="Read-only, immutable administrative history and security events. All sensitive metadata is recursively sanitized."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <Section title="Security & System Timeline" subtitle="Chronological audit records">
          {loading ? (
            <LoadingState text="Loading audit logs..." />
          ) : audits.length === 0 ? (
            <EmptyState
              title="No Audit Records Found"
              description="There are currently no recorded audit logs in the system."
            />
          ) : (
            <>
              {/* Desktop Structured Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Actor</th>
                      <th className="px-5 py-3.5">Target</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Sanitized Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {audits.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-5 py-3.5 font-sans font-semibold text-white">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            {audit.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">
                          {audit.actorEmail || `Actor #${audit.actorId || 'system'}`}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">
                          {audit.targetType} #{audit.targetId || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-sans">
                          {new Date(audit.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                          {audit.metadata ? JSON.stringify(audit.metadata) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-3">
                {audits.map((audit) => (
                  <Card key={audit.id} padding="p-4" className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-white border border-slate-700">
                        {audit.action}
                      </span>
                      <time className="text-[11px] text-slate-400">
                        {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Actor:</span>{' '}
                      {audit.actorEmail || `Actor #${audit.actorId || 'system'}`}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Target:</span> {audit.targetType} #{audit.targetId || '—'}
                    </div>
                    {audit.metadata && (
                      <pre className="mt-2 p-2 rounded bg-slate-950 text-[10px] text-slate-400 font-mono overflow-x-auto">
                        {JSON.stringify(audit.metadata, null, 2)}
                      </pre>
                    )}
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
