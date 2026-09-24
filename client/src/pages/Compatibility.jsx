import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CURRENT_VERSION_LABEL } from '../constants/version';
import { getSafeDiagnostics } from '../utils/testingTools';
import { isWebNFCSupported } from '../utils/nfcParser';
import useDocumentTitle from '../hooks/useDocumentTitle';

const COMPATIBILITY_CARDS = [
  {
    title: 'Universal URL fallback',
    status: 'PASSED',
    statusLabel: 'iPhone validated',
    body: 'Supported on iPhone Safari and Android browsers. A public tap resolves card status only and never records attendance. Attendance requires an authenticated operator and an open session.',
  },
  {
    title: 'Android Web NFC',
    status: 'PENDING',
    statusLabel: 'Pending test',
    body: 'Requires HTTPS and a compatible Chromium browser with NDEFReader support. Physical Android validation remains pending.',
  },
  {
    title: 'Desktop',
    status: 'ACTIVE',
    statusLabel: 'Supported',
    body: 'Management features work normally. Direct Web NFC scanning is unavailable, so use manual check-in or the card URL fallback.',
  },
  {
    title: 'Manual fallback',
    status: 'ACTIVE',
    statusLabel: 'Always available',
    body: 'If direct scanning is unavailable, use the card URL tap flow or an operator-assisted manual check-in on the Operator Console.',
  },
];

export default function Compatibility() {
  useDocumentTitle('Compatibility');

  const diagnostics = useMemo(() => getSafeDiagnostics(CURRENT_VERSION_LABEL, window), []);
  const [copied, setCopied] = useState(false);

  const webNfcSupported = isWebNFCSupported();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-4xl">
        <PageHeader
          title="Device compatibility"
          description="How TapTrack NFC behaves on iPhone, Android, and desktop — plus credential-free diagnostics."
        />

        <Section
          title="Supported flows"
          subtitle="Feature detection is based on runtime capability, never user-agent strings"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {COMPATIBILITY_CARDS.map((item) => (
              <Card key={item.title} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-white">{item.title}</h2>
                  <Badge status={item.status} className="shrink-0">
                    {item.statusLabel}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="iPhone NFC attendance"
          subtitle="Physically validated Safari NFC URL workflow"
        >
          <Card className="p-5">
            <ol className="space-y-3 text-sm text-slate-300">
              <li><strong className="text-white">1. Public tap:</strong> Tap the physical card and open the iPhone NFC notification. Safari opens the secure <code className="font-mono text-xs text-blue-300">/t#credential</code> URL, removes the credential from the visible address, and verifies the card. <strong>No attendance is recorded.</strong></li>
              <li><strong className="text-white">2. Attendance mode:</strong> An ADMIN or OPERATOR signs in to Safari, selects an OPEN attendance session, and enables <strong>iPhone Attendance Mode</strong>.</li>
              <li><strong className="text-white">3. Tap to attend:</strong> The next physical card tap uses that exact selected session. The server derives the event from the session and records method <strong>NFC URL</strong>.</li>
              <li><strong className="text-white">4. Duplicate protection:</strong> A second tap for the same user/session reports <strong>Already Recorded</strong> instead of creating a duplicate.</li>
            </ol>
            <p className="mt-4 text-xs text-slate-500">The selected attendance context stays on that browser/device until it is stopped, expires, becomes invalid, or the operator signs out.</p>
          </Card>
        </Section>

        <Section
          title="Android direct Web NFC"
          subtitle="Supported by the code path; physical NDEFReader acceptance remains pending"
        >
          <Card className="p-5 space-y-3 text-sm text-slate-300">
            <p>On a compatible Android Chromium browser, TapTrack feature-detects <code className="font-mono text-xs text-blue-300">NDEFReader</code>. When available, an authenticated ADMIN or OPERATOR can use the NFC Reader during an open attendance session.</p>
            <p className="text-amber-300"><strong>QA status:</strong> Android physical NDEFReader validation has not been confirmed yet. The Universal NFC URL fallback remains available when direct Web NFC is unavailable.</p>
          </Card>
        </Section>

        <Section
          title="This device"
          subtitle="Live capability check for the browser you are using now"
        >
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={webNfcSupported ? 'ACTIVE' : 'CLOSED'}>
                {webNfcSupported ? 'Web NFC available' : 'Web NFC unavailable'}
              </Badge>
              <span className="text-xs text-slate-400">
                {webNfcSupported
                  ? 'Direct scanning can be used where the browser exposes NDEFReader.'
                  : 'Use the Universal URL tap flow or manual check-in on this device.'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Safe diagnostics</h3>
                <span className="text-xs font-mono text-slate-400">{CURRENT_VERSION_LABEL}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <span className="text-slate-500">Direct Web NFC</span>
                  <p className="mt-1 font-semibold text-slate-200">{webNfcSupported ? 'Available in this browser' : 'Unavailable in this browser'}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <span className="text-slate-500">Universal URL fallback</span>
                  <p className="mt-1 font-semibold text-slate-200">Use physical card notification → TapTrack /t</p>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-slate-300">Show credential-free JSON diagnostics</summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-400 leading-relaxed">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </details>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={copy} variant="primary" size="md" className="sm:w-auto">
                  {copied ? 'Copied' : 'Copy diagnostics'}
                </Button>
                <Link
                  to="/operator/nfc-reader"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm font-semibold min-h-[44px] transition-colors"
                >
                  Open NFC Scanner
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                This report excludes credentials, cookies, account data, hashes, and secrets.
              </p>
            </div>
          </Card>
        </Section>

        <Section
          title="How each path works"
          subtitle="All credential handlers resolve a card first, then call the shared attendance service"
        >
          <Card className="p-5">
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300">
              <li>
                <strong className="text-white">Web NFC (Android):</strong> Scan the card URL in a compatible Chromium browser while signed in as an operator with an open session.
              </li>
              <li>
                <strong className="text-white">NFC URL (iPhone):</strong> Tap the physical card to the phone, open the system notification, and Safari loads the secure /t credential link.
              </li>
              <li>
                <strong className="text-white">Manual fallback:</strong> An operator selects the attendee on the Operator Console when scanning is unavailable.
              </li>
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Cards store only an opaque random credential inside a TapTrack HTTPS URL. Names, emails, roles, and database IDs are never written to the card.
            </p>
          </Card>
        </Section>
      </PageContainer>
    </div>
  );
}
