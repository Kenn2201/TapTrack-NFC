import { useCallback, useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { eventService } from '../services/eventService';

const emptyForm = { name: '', description: '', startAt: '', endAt: '' };
export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => setEvents((await eventService.getAll()).events || []), []);
  useEffect(() => { load().catch((e) => setMessage(e.message)); }, [load]);
  const submit = async (e) => {
    e.preventDefault(); setMessage('');
    try {
      await eventService.create({ ...form, startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString() });
      setForm(emptyForm); setMessage('Event created.'); await load();
    } catch (error) { setMessage(error.message); }
  };
  const open = async (eventId) => { try { await eventService.openSession(eventId); setMessage('Attendance session opened.'); await load(); } catch (e) { setMessage(e.message); } };
  return <div className="min-h-screen bg-slate-950 text-slate-100"><Header /><main className="mx-auto max-w-6xl p-4 sm:p-8">
    <h1 className="text-3xl font-bold">Events</h1><p className="mt-1 text-slate-400">Create events and open their attendance sessions.</p>
    {message && <div role="status" className="my-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm">{message}</div>}
    <form onSubmit={submit} className="my-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:grid-cols-2">
      <label className="text-sm">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
      <label className="text-sm">Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
      <label className="text-sm">Starts<input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
      <label className="text-sm">Ends<input required type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3" /></label>
      <button className="min-h-11 rounded-lg bg-blue-600 px-4 font-semibold sm:col-span-2">Create event</button>
    </form>
    <div className="grid gap-4 md:grid-cols-2">{events.map((event) => <article key={event.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex justify-between gap-3"><h2 className="font-bold">{event.name}</h2><span className="text-xs text-blue-300">{event.status}</span></div><p className="mt-2 text-sm text-slate-400">{event.description || 'No description'}</p><p className="mt-3 text-xs text-slate-500">{new Date(event.startAt).toLocaleString()} – {new Date(event.endAt).toLocaleString()}</p>{event.status === 'DRAFT' && <button onClick={() => open(event.id)} className="mt-4 min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold">Open attendance session</button>}</article>)}</div>
  </main></div>;
}
