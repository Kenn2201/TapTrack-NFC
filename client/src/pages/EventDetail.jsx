import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { eventService } from '../services/eventService';
import { authService } from '../services/authService';
import { adminEventParticipantsService } from '../services/adminEventParticipantsService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function EventDetail({ eventId }) {
  useDocumentTitle('Event Detail');
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteUsers, setInviteUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const canInvite = user?.role === 'ADMIN';

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    setLoading(true);
    eventService.getById(eventId)
      .then((data) => {
        if (active) setEvent(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load event.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (isStaff) {
      adminEventParticipantsService.list(eventId)
        .then((data) => {
          if (active) setParticipants(data);
        })
        .catch(() => {
          if (active) setParticipants([]);
        });
    }

    return () => { active = false; };
  }, [eventId, isStaff]);

  useEffect(() => {
    if (!inviteModal || !canInvite) return;
    let active = true;
    authService.getStaffUsers(inviteSearch)
      .then((res) => {
        if (active) setInviteUsers(res.users || []);
      })
      .catch(() => {
        if (active) setInviteUsers([]);
      });
    return () => { active = false; };
  }, [inviteModal, inviteSearch, canInvite]);

  const fetchParticipants = async () => {
    if (!isStaff) return;
    try {
      setParticipants(await adminEventParticipantsService.list(eventId));
    } catch {
      setParticipants([]);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!canInvite || selectedUserIds.length === 0) return;

    setInviteLoading(true);
    setError(null);
    try {
      await adminEventParticipantsService.invite(eventId, selectedUserIds);
      setInviteModal(false);
      setSelectedUserIds([]);
      setInviteSearch('');
      await fetchParticipants();
    } catch (err) {
      setError(err.message || 'Failed to add required participants.');
    } finally {
      setInviteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    const value = new Date(dateStr);
    if (Number.isNaN(value.getTime())) return 'Not available';
    return value.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Event Not Found</h1>
          <p className="text-slate-400">{error || 'The requested event does not exist or is not available to your account.'}</p>
        </div>
      </div>
    );
  }

  const inviteOnly = event.visibility === 'INVITE_ONLY';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer>
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <PageHeader
          title={event.name}
          description={event.description}
          badge={
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
              inviteOnly
                ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
            }`}>
              {inviteOnly ? 'Invite Only' : 'Public'}
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="Event Information" subtitle="Details and schedule">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Status</span>
                    <Badge status={event.status} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Access</span>
                    <p className="text-sm text-white">{inviteOnly ? 'Invite Only' : 'Public'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Schedule</span>
                  <p className="text-sm text-white">{formatDate(event.startAt)} – {formatDate(event.endAt)}</p>
                </div>
                {event.location && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Location</span>
                    <p className="text-sm text-slate-300">{event.location}</p>
                  </div>
                )}
                {event.description && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium block mb-1">Description</span>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </Card>
            </Section>

            <Section title="Attendance Session" subtitle="Current session status">
              <Card className="p-6">
                {event.attendanceSession ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Session Status</div>
                      <Badge status={event.attendanceSession.status} />
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Opened</div>
                      <div className="text-sm font-mono text-white">{formatDate(event.attendanceSession.openedAt)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-400 mb-1">Check-ins</div>
                      <div className="text-2xl font-bold text-white">{event.attendanceSession.checkInCount || 0}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">No attendance session opened yet.</p>
                )}
              </Card>
            </Section>

            {isStaff && inviteOnly && (
              <Section title="Required Participants" subtitle="Users expected to attend this invite-only event">
                <Card className="p-0">
                  <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">Expected Participants ({participants.length})</h3>
                    {canInvite && (
                      <Button onClick={() => setInviteModal(true)} className="w-full sm:w-auto">Add Participants</Button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {participants.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">No required participants selected yet.</div>
                    ) : (
                      participants.map((p) => (
                        <div key={p.id} className="p-4 hover:bg-slate-800/50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                              {(p.firstName || p.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-slate-400 truncate">{p.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-full px-2 py-1">
                            Expected
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </Section>
            )}

            {!isStaff && (
              <Section title="Attendance Requirement" subtitle={inviteOnly ? 'Required event' : 'Optional public event'}>
                <Card className="p-6">
                  {inviteOnly ? (
                    <div>
                      <p className="font-medium text-white">You are invited and expected to attend this event.</p>
                      <p className="text-sm text-slate-400 mt-1">
                        After the event closes, attendance at this event contributes to your Attendance Rate.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-white">This is a public event.</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Any active user may check in. Not attending a public event does not lower your Attendance Rate.
                      </p>
                    </div>
                  )}
                </Card>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            {isStaff && (
              <Section title="Quick Actions" subtitle="Event operations">
                <Card className="p-4 space-y-3">
                  {canInvite && inviteOnly && (
                    <Button variant="outline" className="w-full" onClick={() => setInviteModal(true)}>Add Required Participants</Button>
                  )}
                  <Link
                    to="/operator"
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold min-h-[44px] transition-colors"
                  >
                    Open Operator Console
                  </Link>
                </Card>
              </Section>
            )}

            <Section title="Event Creator" subtitle="Event ownership">
              <Card className="p-4">
                <p className="text-sm text-slate-400">Created by: {event.creator?.email || 'Unknown'}</p>
                <p className="text-sm text-slate-400 mt-1">Created: {formatDate(event.createdAt)}</p>
              </Card>
            </Section>
          </div>
        </div>

        {canInvite && inviteOnly && (
          <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Add Required Participants" maxWidth="max-w-md">
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Search active users"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="Name or email..."
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800/70">
                {inviteUsers.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500">No active users found.</p>
                ) : (
                  inviteUsers.map((u) => {
                    const checked = selectedUserIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-800/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedUserIds((prev) => checked ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm text-white truncate">{u.firstName} {u.lastName}</span>
                          <span className="block text-xs text-slate-500 truncate">{u.email}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-purple-300">{selectedUserIds.length} selected</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setInviteModal(false)}>Cancel</Button>
                <Button type="submit" loading={inviteLoading} disabled={inviteLoading || selectedUserIds.length === 0}>Add Participants</Button>
              </div>
            </form>
          </Modal>
        )}
      </PageContainer>
    </div>
  );
}
