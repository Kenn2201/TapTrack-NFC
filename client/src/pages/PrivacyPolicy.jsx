import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function PrivacyPolicy() {
  useDocumentTitle('Privacy Policy');
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <PageContainer maxWidth="max-w-3xl">
        <PageHeader title="Privacy Policy" description="How the TapTrack NFC demonstration handles account and attendance information." />
        <Card className="p-6 sm:p-8 space-y-5 text-sm leading-6 text-slate-300">
          <p>TapTrack NFC stores the account, event, attendance, and card metadata needed to provide the demonstration. Physical NFC cards do not contain names, email addresses, roles, attendance history, or database user IDs.</p>
          <p>Physical cards carry only an opaque credential. The server stores a derived credential hash used to resolve the card. Raw card credentials are only shown during the one-time provisioning workflow and are not available through normal card detail screens.</p>
          <p>Administrative audit records are sanitized to avoid storing password, token, secret, cookie, credential, hash, database URL, or API-key values in metadata.</p>
          <p>This page describes the behavior of the current public demonstration and is not a claim of regulatory certification.</p>
        </Card>
      </PageContainer>
      <Footer />
    </div>
  );
}
