import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import { eventService } from '../services/eventService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialForm = {
  name: '',
  description: '',
  startAt: '',
  endAt: '',
};

export default function AdminEvents() {
  useDocumentTitle('Manage Events');

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [alert, setAlert] = useState(null); // { type, message }

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventService.getAll();
      setEvents(res.events || []);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to load events.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Front-end date validation
    if (!form.startAt || !form.endAt) {
      setAlert({
        type: 'error',
        message: 'Unable to create event. Please review the dates and try again.',
      });
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      setAlert({
        type: 'error',
        message: 'Unable to create event. Please review the dates and try again.',
      });
      return;
    }

    setCreating(true);
    try {
      // Canonical payload contract
      await eventService.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        status: 'DRAFT',
      });

      setForm(initialForm);
      setAlert({
        type: 'success',
        message: 'Event created successfully.',
      });
      await loadEvents();
    } catch (err) {
      // Never expose PostgreSQL errors to users
      const raw = String(err.message || '');
      if (/postgres|relation|syntax error|constraint|null value|database/i.test(raw)) {
        setAlert({
          type: 'error',
          message: 'Unable to create event. Please review the dates and try again.',
        });
      } else {
        setAlert({
          type: 'error',
          message: raw || 'Unable to create event. Please review the dates and try again.',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSession = async (eventId) => {
    setOpeningId(eventId);
    setAlert(null);
    try {
      await eventService.openSession(eventId);
      setAlert({
        type: 'success',
        message: 'Attendance session opened successfully.',
      });
      await loadEvents();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to open attendance session.',
      });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        <PageHeader
          title="Manage Events"
          description="Create events, configure schedules, and open attendance sessions for live attendee check-ins."
        />

        {alert && (
          <div className="mb-6">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Create Event Form */}
        <Section title="Create New Event" subtitle="Specify event details and scheduling window">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Event Name"
                  placeholder="e.g. Annual Developer Summit 2026"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start Date & Time"
                    type="datetime-local"
                    required
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  />
                  <Input
                    label="End Date & Time"
                    type="datetime-local"
                    required
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  />
                </div>
              </div>

              <Textarea
                label="Description (Optional)"
                placeholder="Brief summary of event agenda, location, or operator notes..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={creating}
                  disabled={creating || !form.name || !form.startAt || !form.endAt}
                >
                  Create Event
                </Button>
              </div>
            </form>
          </Card>
        </Section>

        {/* Existing Events List */}
        <Section title="Existing Events" subtitle="All events in system with lifecycle and session status">
          {loading ? (
            <LoadingState text="Loading events..." />
          ) : events.length === 0 ? (
            <EmptyState
              title="No Events Found"
              description="No events have been created yet. Use the form above to create your first event."
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Event</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Schedule</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{evt.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {evt.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={evt.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-300">
                          <div>
                            {new Date(evt.startAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-slate-500">
                            {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {evt.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="success"
                              loading={openingId === evt.id}
                              onClick={() => handleOpenSession(evt.id)}
                            >
                              Open Session
                            </Button>
                          )}
                          {evt.status === 'OPEN' && (
                            <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Session Open
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="md:hidden space-y-4">
                {events.map((evt) => (
                  <Card key={evt.id} padding="p-5" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-base">{evt.name}</h3>
                      <StatusBadge status={evt.status} />
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="text-slate-200">
                          {new Date(evt.startAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="text-slate-200">
                          {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {evt.status === 'DRAFT' && (
                      <div className="pt-2">
                        <Button
                          variant="success"
                          className="w-full"
                          loading={openingId === evt.id}
                          onClick={() => handleOpenSession(evt.id)}
                        >
                          Open Attendance Session
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </Section>
      </PageContainer>
    </div>
  );
}
