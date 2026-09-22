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
import Modal from '../components/ui/Modal';
import { eventService } from '../services/eventService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialForm = {
  name: '',
  description: '',
  location: '',
  startAt: '',
  endAt: '',
};

function formatSchedule(evt) {
  const start = new Date(evt.startAt);
  const end = new Date(evt.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  const date = start.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const time = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return { date, time };
}

export default function AdminEvents() {
  useDocumentTitle('Manage Events');

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [createModal, setCreateModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
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

    if (!form.startAt || !form.endAt) {
      setAlert({
        type: 'error',
        message: 'Unable to create event. Please review the dates and try again.',
      });
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setAlert({
        type: 'error',
        message: 'Unable to create event. Please review the dates and try again.',
      });
      return;
    }

    setCreating(true);
    try {
      await eventService.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        status: 'DRAFT',
      });

      setForm(initialForm);
      setCreateModal(false);
      setAlert({
        type: 'success',
        message: 'Event created successfully.',
      });
      await loadEvents();
    } catch (err) {
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
      setDetailEvent(null);
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

  const renderSessionState = (evt) => {
    if (evt.hasOpenSession) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Session Open
        </span>
      );
    }
    if (evt.status === 'OPEN') {
      return <span className="text-xs text-slate-400 font-medium">No open session</span>;
    }
    return <span className="text-xs text-slate-600">—</span>;
  };

  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        <PageHeader
          title="Events"
          description="Create events, review schedules, and open attendance sessions."
          actions={
            <Button onClick={() => setCreateModal(true)}>
              Create Event
            </Button>
          }
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

        <Section title="All Events" subtitle="Event schedule, lifecycle, and attendance overview">
          {loading ? (
            <LoadingState text="Loading events..." rows={4} />
          ) : events.length === 0 ? (
            <EmptyState
              title="No Events Found"
              description="No events have been created yet. Click 'Create Event' to add your first event."
              action={
                <Button onClick={() => setCreateModal(true)}>Create Event</Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((evt) => {
                const schedule = formatSchedule(evt);
                return (
                  <Card
                    key={evt.id}
                    variant="interactive"
                    padding="p-5"
                    className="space-y-3"
                    onClick={() => setDetailEvent(evt)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-base leading-snug">{evt.name}</h3>
                      <StatusBadge status={evt.status} />
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{evt.description}</p>
                    )}
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between gap-2">
                        <span>Schedule</span>
                        <span className="text-slate-200 text-right">{schedule.date}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Time</span>
                        <span className="text-slate-200 text-right">{schedule.time}</span>
                      </div>
                      {evt.location && (
                        <div className="flex justify-between gap-2">
                          <span>Location</span>
                          <span className="text-slate-200 text-right">{evt.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span title="Participants"><strong className="text-slate-200">{evt.participantCount ?? 0}</strong> invited</span>
                        <span title="Attendance records"><strong className="text-slate-200">{evt.attendanceCount ?? 0}</strong> attended</span>
                      </div>
                      {evt.hasOpenSession && renderSessionState(evt)}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>
      </PageContainer>

      {/* Create Event Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Event"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-[11px] text-slate-500">
            Times are shown in <strong className="text-slate-400">{timezoneLabel}</strong> and stored in UTC internally.
          </p>
          <Input
            label="Location (optional)"
            placeholder="e.g. Makati City, Philippines"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Brief summary of event agenda, location, or operator notes..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
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
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        title="Event Details"
        maxWidth="max-w-lg"
      >
        {detailEvent && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-white">{detailEvent.name}</h3>
              <StatusBadge status={detailEvent.status} />
            </div>
            {detailEvent.description && (
              <p className="text-sm text-slate-400 leading-relaxed">{detailEvent.description}</p>
            )}
            <div className="divide-y divide-slate-800/80">
              {(() => {
                const s = formatSchedule(detailEvent);
                return (
                  <>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Date</span>
                      <span className="text-sm text-slate-200">{s.date}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Time</span>
                      <span className="text-sm text-slate-200">{s.time} ({timezoneLabel})</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Location</span>
                      <span className="text-sm text-slate-200">{detailEvent.location || '—'}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Creator</span>
                      <span className="text-sm text-slate-200">
                        {detailEvent.createdBy ? `User #${detailEvent.createdBy}` : 'System'}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Participants</span>
                      <span className="text-sm text-slate-200">{detailEvent.participantCount ?? 0}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Attendance Records</span>
                      <span className="text-sm text-slate-200">{detailEvent.attendanceCount ?? 0}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-xs text-slate-400">Session State</span>
                      <span className="text-sm">{renderSessionState(detailEvent)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {(detailEvent.status === 'DRAFT' || detailEvent.status === 'OPEN') && (
              <div className="pt-3 border-t border-slate-800">
                {detailEvent.status === 'DRAFT' && !detailEvent.hasOpenSession && (
                  <Button
                    variant="success"
                    className="w-full"
                    loading={openingId === detailEvent.id}
                    onClick={() => handleOpenSession(detailEvent.id)}
                  >
                    Open Attendance Session
                  </Button>
                )}
                {detailEvent.status === 'OPEN' && !detailEvent.hasOpenSession && (
                  <Button
                    variant="success"
                    className="w-full"
                    loading={openingId === detailEvent.id}
                    onClick={() => handleOpenSession(detailEvent.id)}
                  >
                    Reopen Attendance Session
                  </Button>
                )}
                {detailEvent.hasOpenSession && (
                  <p className="text-xs text-center text-emerald-400 font-medium">
                    An attendance session is currently open for this event.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}