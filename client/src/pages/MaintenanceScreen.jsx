import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { adminPlatformService } from '../services/adminPlatformService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function MaintenanceScreen() {
  useDocumentTitle('Maintenance Mode');
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await adminPlatformService.getStatus();
      setMaintenance(data);
    } catch {
      // Ignore - if API fails, we're probably offline or truly down
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await new Promise(r => setTimeout(r, 1000));
    fetchStatus();
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not in maintenance - render nothing (parent should not show this)
  if (!maintenance?.maintenanceEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-md">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-400/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Scheduled Maintenance</h1>
          <p className="text-lg text-slate-300 mb-2">TapTrack NFC is Upgrading</p>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">
            We're performing scheduled maintenance to improve your experience. This should only take a few minutes.
          </p>

          {maintenance.maintenanceMessage && (
            <Card className="max-w-xs mx-auto mb-8 p-5 bg-amber-400/10 border-amber-400/30">
              <div className="flex items-center gap-2 text-amber-300 mb-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-sm">Maintenance Notice</span>
              </div>
              <p className="text-sm text-amber-200">{maintenance.maintenanceMessage}</p>
            </Card>
          )}

          <div className="space-y-3 w-full max-w-xs mx-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRetry}
              loading={retrying}
            >
              {retrying ? 'Checking...' : 'Check Again'}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>

          <p className="mt-8 text-xs text-slate-500 max-w-xs mx-auto">
            If you are an administrator, <a href="/login" className="text-emerald-400 hover:underline">sign in</a> to bypass maintenance mode.
          </p>
        </div>

        <div className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>TapTrack NFC • Maintenance Mode</p>
        </div>
      </PageContainer>
    </div>
  );
}