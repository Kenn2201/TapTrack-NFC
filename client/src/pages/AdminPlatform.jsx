import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import AdminWorkspaceNav from '../components/layout/AdminWorkspaceNav';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { adminPlatformService } from '../services/adminPlatformService';
import Modal from '../components/ui/Modal';
import useDocumentTitle from '../hooks/useDocumentTitle';

const MAINTENANCE_PRESETS = [
  'TapTrack is undergoing scheduled maintenance. Please try again shortly.',
  'TapTrack is temporarily unavailable while a deployment is being verified.',
  'Attendance services are paused for maintenance. Administrators still have access.',
];

export default function AdminPlatform() {
  useDocumentTitle('Admin - Platform Maintenance');
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [confirmEnableOpen, setConfirmEnableOpen] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminPlatformService.getStatus();
      setMaintenance(data);
      setFormMessage(data.maintenanceMessage || '');
    } catch (err) {
      setError(err.message || 'Failed to load maintenance status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const applyToggle = async () => {
    if (!maintenance) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const newState = !maintenance.maintenanceEnabled;
      const data = await adminPlatformService.setMaintenance({
        enabled: newState,
        message: newState ? formMessage : '',
      });
      setMaintenance({
        maintenanceEnabled: Boolean(data.maintenanceEnabled),
        maintenanceMessage: data.maintenanceMessage || '',
        estimatedReturn: data.estimatedReturn || null,
        releaseLabel: data.releaseLabel || null,
        updatedBy: data.updatedBy || null,
        updatedAt: data.updatedAt || null,
      });
      setMessage(newState ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.');
      setConfirmEnableOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to toggle maintenance mode.');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <AdminWorkspaceNav />

      <PageContainer maxWidth="max-w-3xl">
        <PageHeader
          title="Platform Maintenance"
          description="Control global maintenance mode. When enabled, all non-admin traffic receives a maintenance response."
        />

        {message && (
          <Alert type="success" message={message} onClose={() => setMessage(null)} className="mb-6" />
        )}

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />
        )}

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-400">Loading platform status...</span>
            </div>
          </Card>
        ) : (
          <>
            <Card className="mb-6 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Current Status</h3>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${maintenance.maintenanceEnabled ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className={`text-lg font-semibold ${maintenance.maintenanceEnabled ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {maintenance.maintenanceEnabled ? 'MAINTENANCE MODE' : 'LIVE / ACCEPTING TRAFFIC'}
                    </span>
                  </div>
                  {maintenance.maintenanceMessage && (
                    <p className="mt-2 text-sm text-slate-400 bg-slate-800/50 p-3 rounded max-w-md">
                      {maintenance.maintenanceMessage}
                    </p>
                  )}
                </div>
                <Button
                  variant={maintenance.maintenanceEnabled ? 'destructive' : 'primary'}
                  onClick={() => maintenance.maintenanceEnabled ? applyToggle() : setConfirmEnableOpen(true)}
                  loading={saving}
                  className="w-full sm:w-auto min-h-[48px]"
                >
                  {maintenance.maintenanceEnabled ? 'Disable Maintenance Mode' : 'Review & Enable Maintenance'}
                </Button>
              </div>
            </Card>

            <Card className="mb-6 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Maintenance Message</h3>
              <p className="text-sm text-slate-400 mb-3">Message shown to users when maintenance mode is active.</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {MAINTENANCE_PRESETS.map((preset, index) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormMessage(preset)}
                    className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-left text-xs text-slate-300 hover:border-amber-500/40"
                  >
                    Preset {index + 1}
                  </button>
                ))}
              </div>
              <textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                placeholder="Enter maintenance message (optional)..."
                maxLength={500}
              />
              <p className="mt-2 text-xs text-slate-500">
                {formMessage.length}/500 characters. Shown to all non-admin users during maintenance.
              </p>
            </Card>

            <Card className="p-6 bg-slate-900/50 border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-2">How Maintenance Mode Works</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> <strong>Public endpoints</strong> (e.g., `/api/platform/maintenance-status`) remain accessible for health checks.</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> <strong>Admin users</strong> bypass maintenance mode and retain full API access.</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-400 flex-shrink-0" /> <strong>Regular users</strong> receive HTTP 503 with the maintenance message for all API requests.</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 flex-shrink-0" /> <strong>Client apps</strong> should poll the public status endpoint and display a maintenance screen when enabled.</li>
              </ul>
            </Card>
          </>
        )}
      </PageContainer>

      <Modal
        isOpen={confirmEnableOpen}
        onClose={() => !saving && setConfirmEnableOpen(false)}
        title="Enable Maintenance Mode?"
        description="This affects non-admin API traffic. Review the public message before confirming."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Non-admin requests will receive HTTP 503 while maintenance mode is enabled. Public maintenance status remains available and administrators retain access.
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Public message</p>
            <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
              {formMessage.trim() || 'TapTrack is currently undergoing maintenance.'}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmEnableOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={applyToggle} loading={saving} disabled={saving}>Confirm Maintenance Mode</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}