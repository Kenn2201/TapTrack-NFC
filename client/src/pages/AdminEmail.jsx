import React, { useState } from 'react';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { adminEmailService } from '../services/adminEmailService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const EMAIL_PRESETS = {
  ACCOUNT_ACTIVATED: {
    label: 'Account activated',
    subject: 'Your TapTrack account is active',
    text: 'Your TapTrack account has been activated. You can now sign in and use the features available to your role.',
  },
  ROLE_CHANGED: {
    label: 'Role changed',
    subject: 'Your TapTrack role was updated',
    text: 'Your TapTrack account role has been updated. Sign in again if your available tools have changed.',
  },
  EVENT_INVITATION: {
    label: 'Event invitation',
    subject: 'You are invited to a TapTrack event',
    text: 'You have been selected as a required participant for a TapTrack event. Sign in to review the event details and schedule.',
  },
  NFC_REQUEST: {
    label: 'NFC setup / replacement',
    subject: 'Update on your NFC card request',
    text: 'There is an update to your TapTrack NFC setup or replacement request. Sign in and open My Card to review your request status.',
  },
  EVENT_REMINDER: {
    label: 'Event reminder',
    subject: 'TapTrack event reminder',
    text: 'Reminder: you have an upcoming TapTrack event. Sign in to review the schedule and attendance details.',
  },
  GENERAL: {
    label: 'General announcement',
    subject: 'TapTrack announcement',
    text: 'TapTrack has an update for you.',
  },
  MAINTENANCE: {
    label: 'Maintenance notice',
    subject: 'TapTrack maintenance notice',
    text: 'TapTrack may be temporarily unavailable during scheduled maintenance. Please try again after the maintenance window.',
  },
};

const applyPreset = (setForm, key) => {
  const preset = EMAIL_PRESETS[key];
  if (!preset) return;
  setForm((current) => ({ ...current, subject: preset.subject, text: preset.text, html: '' }));
};

export default function AdminEmail() {
  useDocumentTitle('Admin - Email Suite');
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [directPreviewModal, setDirectPreviewModal] = useState(false);

  const [directForm, setDirectForm] = useState({ to: '', subject: '', html: '', text: '' });
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', html: '', text: '', confirmBroadcast: false });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400">Administrator access required.</p>
        </div>
      </div>
    );
  }

  const runDiagnostics = async () => {
    setDiagLoading(true);
    setError(null);
    try {
      const data = await adminEmailService.diagnostics();
      setDiagnostics(data);
      setMessage('Diagnostics completed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to run diagnostics.');
    } finally {
      setDiagLoading(false);
    }
  };

  const sendDirect = async (e) => {
    e?.preventDefault?.();
    if (!directForm.to || !directForm.subject || (!directForm.html && !directForm.text)) {
      setError('Recipient, subject, and at least one of HTML/text body are required.');
      return;
    }
    setDirectLoading(true);
    setError(null);
    try {
      await adminEmailService.sendDirect(directForm);
      setDirectForm({ to: '', subject: '', html: '', text: '' });
      setMessage('Direct email sent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to send email.');
    } finally {
      setDirectLoading(false);
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.subject || (!broadcastForm.html && !broadcastForm.text)) {
      setError('Subject and at least one of HTML/text body are required.');
      return;
    }
    if (!broadcastForm.confirmBroadcast) {
      setError('You must confirm the broadcast before sending.');
      return;
    }
    setBroadcastLoading(true);
    setError(null);
    try {
      await adminEmailService.sendBroadcast(broadcastForm);
      setBroadcastForm({ subject: '', html: '', text: '', confirmBroadcast: false });
      setBroadcastModal(false);
      setMessage('Broadcast email sent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      <PageContainer maxWidth="max-w-4xl">
        <PageHeader
          title="Email Suite"
          description="Send direct emails, broadcast to all users, and run diagnostics."
        />

        {message && <Alert type="success" message={message} onClose={() => setMessage(null)} className="mb-6" />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        <Section title="Diagnostics" subtitle="Check whether the email provider is configured on this deployment">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button onClick={runDiagnostics} loading={diagLoading} disabled={diagLoading}>
                Run Diagnostics
              </Button>
              <span className="text-sm text-slate-400">
                This check reports configuration availability only. A real send is what verifies provider delivery.
              </span>
            </div>
            {diagnostics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${diagnostics.configured ? 'bg-emerald-400/10 border border-emerald-400/30' : 'bg-amber-400/10 border border-amber-400/30'}`}>
                  <div className="text-xs text-slate-400 mb-1">Email Provider</div>
                  <div className="text-xl font-bold">{diagnostics.provider || 'RESEND'}</div>
                </div>
                <div className={`p-4 rounded-lg ${diagnostics.configured ? 'bg-emerald-400/10 border border-emerald-400/30' : 'bg-amber-400/10 border border-amber-400/30'}`}>
                  <div className="text-xs text-slate-400 mb-1">Configuration</div>
                  <div className="text-xl font-bold">{diagnostics.configured ? '✓ Configured' : 'Not configured'}</div>
                </div>
              </div>
            )}
          </Card>
        </Section>

        <Section title="Message Templates" subtitle="Start from editable plain-English content, then review before sending">
          <Card className="p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(EMAIL_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(setDirectForm, key)}
                  className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Templates only populate the editor. Nothing is sent until you review and confirm the message.</p>
          </Card>
        </Section>

        <Section title="Direct Email" subtitle="Send a single email to a specific recipient">
          <Card className="space-y-4 p-6">
            <form onSubmit={(e) => { e.preventDefault(); setDirectPreviewModal(true); }} className="space-y-4">
              <Input label="To (Email)" required value={directForm.to} onChange={(e) => setDirectForm({ ...directForm, to: e.target.value })} type="email" placeholder="user@example.com" />
              <Input label="Subject" required value={directForm.subject} onChange={(e) => setDirectForm({ ...directForm, subject: e.target.value })} placeholder="Email subject" />
              <Textarea label="HTML Body" rows={6} value={directForm.html} onChange={(e) => setDirectForm({ ...directForm, html: e.target.value })} placeholder="<p>HTML content...</p>" helperText="Optional if plain-text body is provided" />
              <Textarea label="Plain-text Body" rows={4} value={directForm.text} onChange={(e) => setDirectForm({ ...directForm, text: e.target.value })} placeholder="Plain text content..." helperText="Optional if HTML body is provided" />
              <div className="flex justify-end">
                <Button type="submit" loading={directLoading} disabled={directLoading}>Preview Direct Email</Button>
              </div>
            </form>
          </Card>
        </Section>

        <Section title="Broadcast Email" subtitle="Send an email to all active users (requires confirmation)">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Broadcast emails are sent to ALL active users. This action cannot be undone.</span>
            </div>
            <form onSubmit={sendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start from template (optional)</label>
                <select
                  defaultValue=""
                  onChange={(e) => { applyPreset(setBroadcastForm, e.target.value); e.target.value = ''; }}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                >
                  <option value="">Choose a template…</option>
                  {Object.entries(EMAIL_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
                </select>
              </div>
              <Input label="Subject" required value={broadcastForm.subject} onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })} placeholder="Broadcast subject" />
              <Textarea label="HTML Body" rows={6} value={broadcastForm.html} onChange={(e) => setBroadcastForm({ ...broadcastForm, html: e.target.value })} placeholder="<p>HTML content for all users...</p>" helperText="Optional if plain-text body is provided" />
              <Textarea label="Plain-text Body" rows={4} value={broadcastForm.text} onChange={(e) => setBroadcastForm({ ...broadcastForm, text: e.target.value })} placeholder="Plain text content for all users..." helperText="Optional if HTML body is provided" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastForm.confirmBroadcast}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, confirmBroadcast: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 text-emerald-400 focus:ring-emerald-400"
                />
                <span className="text-sm text-slate-300">I confirm I want to send this broadcast to ALL active users</span>
              </label>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setBroadcastModal(true)} disabled={broadcastLoading}>Preview & Send Broadcast</Button>
              </div>
            </form>
          </Card>
        </Section>

        <Modal isOpen={directPreviewModal} onClose={() => setDirectPreviewModal(false)} title="Review Direct Email" maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm">
              <p><span className="text-slate-500">To:</span> <span className="text-slate-200">{directForm.to || '(missing recipient)'}</span></p>
              <p className="mt-1"><span className="text-slate-500">Subject:</span> <span className="text-slate-200">{directForm.subject || '(missing subject)'}</span></p>
            </div>
            {directForm.text && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">{directForm.text}</pre>}
            {directForm.html && <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">HTML body supplied ({directForm.html.length} characters). It is not executed in this preview.</div>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setDirectPreviewModal(false)} disabled={directLoading}>Back to Edit</Button>
              <Button
                onClick={async () => { await sendDirect(); setDirectPreviewModal(false); }}
                loading={directLoading}
                disabled={directLoading || !directForm.to || !directForm.subject || (!directForm.html && !directForm.text)}
              >
                Confirm & Send
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={broadcastModal} onClose={() => setBroadcastModal(false)} title="Confirm Broadcast" maxWidth="max-w-md">
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Subject: <span className="font-medium">{broadcastForm.subject || '(no subject)'}</span></p>
            <p className="text-sm text-slate-300">Has HTML: <span className="font-medium">{broadcastForm.html ? 'Yes' : 'No'}</span></p>
            <p className="text-sm text-slate-300">Has Text: <span className="font-medium">{broadcastForm.text ? 'Yes' : 'No'}</span></p>
            <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded text-sm text-amber-300">
              This will send to ALL active users. This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBroadcastModal(false)} disabled={broadcastLoading}>Cancel</Button>
              <Button onClick={sendBroadcast} loading={broadcastLoading} disabled={broadcastLoading || !broadcastForm.confirmBroadcast} variant="destructive">Send Broadcast</Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </div>
  );
}