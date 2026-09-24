import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Terms() {
  useDocumentTitle('Terms');
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <PageContainer maxWidth="max-w-3xl">
        <PageHeader title="Terms of Use" description="TapTrack NFC public technology demonstration." />
        <Card className="p-6 sm:p-8 space-y-5 text-sm leading-6 text-slate-300">
          <p>TapTrack NFC is a technology demonstration for NFC credential provisioning and event attendance workflows. Features may change while the project remains a release candidate.</p>
          <p>Do not use the demonstration to store secrets on NFC cards or to bypass account, role, card lifecycle, event, or attendance controls.</p>
          <p>Availability is not guaranteed. Maintenance and deployment limits can temporarily make the service unavailable without changing the meaning of an unknown application route.</p>
          <p>Release-candidate functionality should be validated by a human before it is treated as production-live behavior.</p>
        </Card>
      </PageContainer>
      <Footer />
    </div>
  );
}
