import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { eventService } from '../services/eventService';
export default function Events() {
  const [events, setEvents] = useState([]); const [error, setError] = useState('');
  useEffect(() => { eventService.getAll().then((r) => setEvents(r.events || [])).catch((e) => setError(e.message)); }, []);
  return <div className="min-h-screen bg-slate-950 text-white"><Header /><main className="mx-auto max-w-5xl p-4 sm:p-8"><h1 className="text-3xl font-bold">Events</h1>{error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2">{events.length ? events.map((event) => <article key={event.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex justify-between"><h2 className="font-semibold">{event.name}</h2><span className="text-xs text-blue-300">{event.status}</span></div><p className="mt-2 text-sm text-slate-400">{event.description || 'No description provided.'}</p><p className="mt-3 text-xs text-slate-500">{new Date(event.startAt).toLocaleString()}</p></article>) : <p className="text-slate-400">No events are available yet.</p>}</div></main></div>;
}
