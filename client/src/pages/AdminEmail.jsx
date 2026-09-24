import React, { useState } from 'react';
import Header from '../components/layout/Header';
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
    e.preventDefault();
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
      <Header />

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

        <Section title="Direct Email" subtitle="Send a single email to a specific recipient">
          <Card className="space-y-4 p-6">
            <form onSubmit={sendDirect} className="space-y-4">
              <Input label="To (Email)" required value={directForm.to} onChange={(e) => setDirectForm({ ...directForm, to: e.target.value })} type="email" placeholder="user@example.com" />
              <Input label="Subject" required value={directForm.subject} onChange={(e) => setDirectForm({ ...directForm, subject: e.target.value })} placeholder="Email subject" />
              <Textarea label="HTML Body" rows={6} value={directForm.html} onChange={(e) => setDirectForm({ ...directForm, html: e.target.value })} placeholder="<p>HTML content...</p>" helperText="Optional if plain-text body is provided" />
              <Textarea label="Plain-text Body" rows={4} value={directForm.text} onChange={(e) => setDirectForm({ ...directForm, text: e.target.value })} placeholder="Plain text content..." helperText="Optional if HTML body is provided" />
              <div className="flex justify-end">
                <Button type="submit" loading={directLoading} disabled={directLoading}>Send Direct Email</Button>
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