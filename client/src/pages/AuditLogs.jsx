import React, { useEffect, useMemo, useState } from 'react';
import AdminWorkspaceNav from '../components/layout/AdminWorkspaceNav';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import { adminService } from '../services/adminService';
import useDocumentTitle from '../hooks/useDocumentTitle';

/**
 * Human-readable labels for backend audit action codes.
 */
const ACTION_LABELS = {
  SESSION_OPENED: 'Attendance session opened',
  SESSION_CLOSED: 'Attendance session closed',
  EVENT_CREATED: 'Event created',
  EVENT_UPDATED: 'Event updated',
  CARD_ACTIVATED: 'NFC card activated',
  CARD_PROVISIONED: 'NFC card provisioned',
  CARD_LOST: 'NFC card marked lost',
  CARD_REVOKED: 'NFC card revoked',
  CARD_DISABLED: 'NFC card disabled',
  CARD_REPLACED: 'NFC card replaced',
  CARD_REISSUED: 'NFC card reissued',
  ATTENDANCE_RECORDED: 'Attendance recorded',
  USER_ROLE_CHANGED: 'User role changed',
  PARTICIPANTS_INVITED: 'Participants invited',
  FEEDBACK_SUBMITTED: 'Feedback submitted',
  FEEDBACK_STATUS_UPDATED: 'Feedback status updated',
  ACCOUNT_ARCHIVED: 'Account archived',
  CARD_REQUEST_CREATED: 'NFC card request created',
  CARD_REQUEST_STATUS_CHANGED: 'NFC card request status changed',
  EMAIL_SENT: 'Email sent',
  EMAIL_BROADCAST: 'Email broadcast sent',
};

function humanizeAction(action) {
  if (!action) return 'Unknown action';
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Pick a small set of safe, read-friendly values from the sanitized metadata.
 */
function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AuditLogs() {
  useDocumentTitle('Audit Logs');
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [detail, setDetail] = useState(null);

  const [filterAction, setFilterAction] = useState('ALL');
  const [filterActor, setFilterActor] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');

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

  const actors = useMemo(() => {
    const set = new Set();
    audits.forEach((a) => {
      const name = a.actorEmail || `Actor #${a.actorId || 'system'}`;
      set.add(name);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [audits]);

  const actions = useMemo(() => {
    const set = new Set();
    audits.forEach((a) => set.add(a.action));
    return ['ALL', ...Array.from(set).sort()];
  }, [audits]);

  const filtered = useMemo(() => {
    return audits.filter((a) => {
      if (filterAction !== 'ALL' && a.action !== filterAction) return false;
      if (filterActor !== 'ALL') {
        const name = a.actorEmail || `Actor #${a.actorId || 'system'}`;
        if (name !== filterActor) return false;
      }
      if (filterDate !== 'ALL') {
        const d = new Date(a.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        const day = d.toISOString().split('T')[0];
        if (day !== filterDate) return false;
      }
      return true;
    });
  }, [audits, filterAction, filterActor, filterDate]);

  const uniqueDates = useMemo(() => {
    const set = new Set();
    audits.forEach((a) => {
      const d = new Date(a.createdAt);
      if (!Number.isNaN(d.getTime())) set.add(d.toISOString().split('T')[0]);
    });
    return ['ALL', ...Array.from(set).sort().reverse()];
  }, [audits]);

  const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toCsv = () => {
    const header = ['When', 'Action (code)', 'Action (human)', 'Actor', 'Target type', 'Target ID', 'Metadata'];
    const rows = filtered.map((a) => [
      new Date(a.createdAt).toISOString(),
      a.action,
      humanizeAction(a.action),
      a.actorEmail || `Actor #${a.actorId || 'system'}`,
      a.targetType || '',
      a.targetId || '',
      a.metadata ? JSON.stringify(a.metadata) : '',
    ]);
    const escapeCsv = (v) => `"${String(v).replace(/"/g, '""')}"`;
    return [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
  };

  const toJson = () => JSON.stringify(filtered, null, 2);

  const toMarkdown = () => {
    const lines = ['# TapTrack NFC — Audit Log Export', '', `Generated: ${new Date().toISOString()}`, `Records: ${filtered.length}`, ''];
    lines.push('| When | Action | Actor | Target |');
    lines.push('| --- | --- | --- | --- |');
    filtered.forEach((a) => {
      lines.push(
        `| ${new Date(a.createdAt).toISOString()} | ${humanizeAction(a.action)} (${a.action}) | ${
          a.actorEmail || `Actor #${a.actorId || 'system'}`
        } | ${a.targetType || ''} ${a.targetId || ''} |`
      );
    });
    return lines.join('\n');
  };

  const handleExport = (kind) => {
    setExportError('');
    try {
      const stamp = new Date().toISOString().split('T')[0];
      if (kind === 'CSV') downloadFile(`taptrack-audit-${stamp}.csv`, toCsv(), 'text/csv');
      if (kind === 'JSON') downloadFile(`taptrack-audit-${stamp}.json`, toJson(), 'application/json');
      if (kind === 'Markdown') downloadFile(`taptrack-audit-${stamp}.md`, toMarkdown(), 'text/markdown');
    } catch {
      setExportError('Export failed. Please try again.');
    }
  };

  const renderTargetText = (audit) => {
    const type = audit.targetType || 'SYSTEM';
    return `${type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} ${audit.targetId || '—'}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <AdminWorkspaceNav />

      <PageContainer maxWidth="max-w-6xl">
        <PageHeader
          title="Audit Logs"
          description="Read-only through the application interface."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}
        {exportError && (
          <div className="mb-6">
            <Alert type="error" message={exportError} onClose={() => setExportError('')} />
          </div>
        )}

        <Section title="Security & System Timeline" subtitle="Who did what, when">
          {loading ? (
            <LoadingState text="Loading audit logs..." rows={4} />
          ) : audits.length === 0 ? (
            <EmptyState
              title="No Audit Records Found"
              description="There are currently no recorded audit logs in the system."
            />
          ) : (
            <>
              {/* Filters */}
              <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select
                  label="Action"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  options={actions.map((a) => ({ value: a, label: a === 'ALL' ? 'All actions' : `${a} — ${humanizeAction(a)}` }))}
                />
                <Select
                  label="Actor"
                  value={filterActor}
                  onChange={(e) => setFilterActor(e.target.value)}
                  options={actors.map((a) => ({ value: a, label: a === 'ALL' ? 'All actors' : a }))}
                />
                <Select
                  label="Date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  options={uniqueDates.map((d) => ({ value: d, label: d === 'ALL' ? 'All dates' : d }))}
                />
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>Export CSV</Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('JSON')}>Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('Markdown')}>Export Markdown</Button>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Who</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Target</th>
                      <th className="px-5 py-3.5">When</th>
                      <th className="px-5 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filtered.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white">
                          {audit.actorEmail || `Actor #${audit.actorId || 'system'}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold">
                            {humanizeAction(audit.action)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">{renderTargetText(audit)}</td>
                        <td className="px-5 py-3.5 text-slate-400">{formatWhen(audit.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDetail(audit)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-3">
                {filtered.map((audit) => (
                  <Card key={audit.id} padding="p-4" className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-white border border-slate-700">
                        {humanizeAction(audit.action)}
                      </span>
                      <time className="text-[11px] text-slate-400">
                        {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Who:</span>{' '}
                      {audit.actorEmail || `Actor #${audit.actorId || 'system'}`}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Target:</span> {renderTargetText(audit)}
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setDetail(audit)}>
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Section>
      </PageContainer>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Audit Detail"
        maxWidth="max-w-lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">When</span>
                <span className="text-slate-200">{formatWhen(detail.createdAt)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Action</span>
                <span className="text-slate-200 font-medium">{humanizeAction(detail.action)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Who</span>
                <span className="text-slate-200">{detail.actorEmail || `Actor #${detail.actorId || 'system'}`}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Target</span>
                <span className="text-slate-200">{renderTargetText(detail)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Sanitized Metadata
              </h4>
              {detail.metadata && Object.keys(detail.metadata).length > 0 ? (
                <ul className="text-xs text-slate-300 space-y-1">
                  {Object.entries(detail.metadata).map(([key, value]) => (
                    <li key={key}>
                      <span className="text-slate-500">{key}:</span>{' '}
                      <span className="text-slate-300 break-words">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No metadata recorded.</p>
              )}
            </div>

            {detail.metadata && (
              <details className="pt-2 border-t border-slate-800">
                <summary className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 rounded bg-slate-950 text-[11px] text-slate-400 font-mono overflow-x-auto">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}