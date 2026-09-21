import { Link, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import useNFC from '../hooks/useNFC';

export default function NfcReaderPage() {
  const session = useLocation().state?.session;
  const context = session ? { eventId: session.eventId, sessionId: session.id } : null;
  const { status, result, error, startScan, stopScan, resetScan } = useNFC(context);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-3xl p-4 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">NFC attendance reader</h1><p className="mt-1 text-slate-400">Android Web NFC attendance through the shared attendance engine.</p></div><Link to="/operator" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Back to sessions</Link></div>
    {!session ? <div role="alert" className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"><h2 className="font-semibold">Select an attendance session first</h2><p className="mt-1 text-sm text-amber-100/80">Open the Operator Console and choose Use NFC scanner for an active session. Credential verification alone cannot create attendance.</p></div> : <>
      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"><span className="text-xs text-emerald-300">ACTIVE SESSION</span><h2 className="font-semibold">{session.event?.name}</h2></div>
      <section aria-live="polite" className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-xs font-semibold tracking-wider text-slate-400">{status.replaceAll('_', ' ')}</p>
        {status === 'READY' && <button onClick={startScan} className="mt-5 min-h-12 rounded-xl bg-emerald-600 px-6 font-semibold">Start NFC scanner</button>}
        {['REQUESTING_PERMISSION', 'SCANNING', 'VERIFYING'].includes(status) && <><p className="mt-5 text-slate-300">{status === 'SCANNING' ? 'Hold a TapTrack card near the phone.' : 'Please wait…'}</p><button onClick={stopScan} className="mt-5 rounded-lg border border-slate-700 px-4 py-2">Stop scanner</button></>}
        {status === 'SUCCESS' && result && <><div className="mt-5 rounded-xl bg-emerald-500/10 p-5"><h2 className="text-xl font-bold text-emerald-300">Attendance recorded</h2><p className="mt-2 text-sm">{result.card?.cardLabel} · {result.record?.method}</p></div><button onClick={resetScan} className="mt-5 min-h-11 rounded-lg bg-emerald-600 px-5">Scan another card</button></>}
        {status === 'ERROR' && error && <><div className="mt-5 rounded-xl bg-rose-500/10 p-5 text-rose-200"><strong>{error.code}</strong><p>{error.message}</p></div><button onClick={resetScan} className="mt-5 min-h-11 rounded-lg bg-slate-700 px-5">Try again</button></>}
        {status === 'UNSUPPORTED' && <p className="mt-5 text-amber-300">Web NFC is unavailable. Use manual attendance or the authenticated URL workflow.</p>}
      </section>
    </>}
  </main></div>;
}
