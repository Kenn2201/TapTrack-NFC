import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import CardStatusBadge from '../components/cards/CardStatusBadge';
import { cardService } from '../services/cardService';
export default function MyCard() {
  const [card, setCard] = useState(undefined); const [error, setError] = useState('');
  useEffect(() => { cardService.getMyCard().then((r) => setCard(r.card)).catch((e) => setError(e.message)); }, []);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-3xl p-4 sm:p-8"><h1 className="text-3xl font-bold">My NFC card</h1><p className="mt-1 text-slate-400">Safe card metadata only. Credentials are never displayed.</p>{error && <p role="alert" className="mt-5 text-rose-300">{error}</p>}{card === undefined && !error && <p className="mt-6 text-slate-400">Loading card…</p>}{card === null && <p className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">No NFC card is assigned to your account.</p>}{card && <article className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center justify-between"><span className="font-mono text-2xl font-bold">{card.cardLabel}</span><CardStatusBadge status={card.status} /></div><p className="mt-4 text-sm text-slate-400">Issued {card.issuedAt ? new Date(card.issuedAt).toLocaleDateString() : 'date unavailable'}</p></article>}</main></div>;
}
