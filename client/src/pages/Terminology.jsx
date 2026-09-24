import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import useDocumentTitle from '../hooks/useDocumentTitle';

const terms = [
  ['NFC', 'Near Field Communication. TapTrack uses short-range NFC interactions with physical cards.'],
  ['NFC Web', 'Direct browser NFC reading on supported Android Chromium browsers.'],
  ['NFC URL', 'The universal HTTPS URL stored on the physical card and used by iPhone/Safari and other compatible readers.'],
  ['Opaque credential', 'A random value with no personal information encoded in it.'],
  ['Card lifecycle', 'The card state model: UNASSIGNED, ACTIVE, LOST, REVOKED, REPLACED, or DISABLED.'],
  ['Attendance session', 'The exact event attendance window an operator opens and closes.'],
  ['Activity Pulse', 'Personal attendance activity metrics such as total check-ins and required-event Attendance Rate.'],
];

export default function Terminology() {
  useDocumentTitle('Terminology');
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <PageContainer maxWidth="max-w-4xl">
        <PageHeader title="TapTrack Terminology" description="Plain-English explanations of terms used throughout the product." />
        <div className="grid gap-3 sm:grid-cols-2">
          {terms.map(([term, definition]) => (
            <Card key={term} className="p-5">
              <h2 className="font-semibold text-white">{term}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{definition}</p>
            </Card>
          ))}
        </div>
      </PageContainer>
      <Footer />
    </div>
  );
}
