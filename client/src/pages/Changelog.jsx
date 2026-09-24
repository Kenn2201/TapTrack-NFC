import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { CURRENT_VERSION_LABEL, RELEASE_DATE, RELEASE_NAME } from '../constants/version';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Changelog() {
  useDocumentTitle('Release Notes');
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <PageContainer maxWidth="max-w-4xl">
        <PageHeader title="Release Notes" description="Plain-English product changes for TapTrack NFC." />
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300">{CURRENT_VERSION_LABEL}</span>
            <span className="text-xs text-slate-500">{RELEASE_DATE}</span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">{RELEASE_NAME}</h2>
          <div className="mt-5 space-y-5 text-sm leading-6 text-slate-300">
            <section>
              <h3 className="font-semibold text-white">Events and attendance</h3>
              <p>Events can be public or invite-only. Public events never count as missed attendance. Invite-only attendance is limited to selected participants, and Attendance Rate uses only closed required events.</p>
            </section>
            <section>
              <h3 className="font-semibold text-white">NFC card operations</h3>
              <p>Card holders can submit setup or replacement requests into a dedicated administration queue. TapTrack also blocks a user from ending up with multiple active card credentials through normal activation and assignment workflows.</p>
            </section>
            <section>
              <h3 className="font-semibold text-white">Operations and interface</h3>
              <p>Operator access remains focused on attendance work while administrator-only controls stay restricted. Navigation, compatibility guidance, dialogs, and responsive behavior continue to be refined for production-candidate testing.</p>
            </section>
          </div>
        </Card>
      </PageContainer>
      <Footer />
    </div>
  );
}
