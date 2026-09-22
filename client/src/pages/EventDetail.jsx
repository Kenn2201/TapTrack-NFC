import React, { useState, useEffect } from 'react';
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
import { adminEventParticipantsService } from '../services/adminEventParticipantsService';
import { eventParticipantsService } from '../services/eventParticipantsService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STATUS_LABELS = {
  INVITED: 'Invited',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

const STATUS_COLORS = {
  INVITED: 'bg-blue-400/20 text-blue-400',
  ACCEPTED: 'bg-emerald-400/20 text-emerald-400',
  DECLINED: 'bg-red-400/20 text-red-400',
};

export default function EventDetail({ eventId }) {
  useDocumentTitle('Event Detail');
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      if (user?.role === 'ADMIN' || user?.role === 'OPERATOR') {
        fetchParticipants();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const data = await eventService.getById(eventId);
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Failed to load event.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const data = await adminEventParticipantsService.list(eventId);
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setInviteLoading(true);
    try {
      await adminEventParticipantsService.invite(eventId, emails);
      setInviteModal(false);
      setInviteEmails('');
      await fetchParticipants();
    } catch (err) {
      setError(err.message || 'Failed to send invites.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRsvp = async (status) => {
    if (!user) return;
    setRsvpLoading(true);
    try {
      await eventParticipantsService.rsvp(eventId, user.id, status);
      await fetchParticipants();
    } catch (err) {
      setError(err.message || 'Failed to RSVP.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'full', timeStyle: 'short' });

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
          <p className="text-slate-400">{error || 'The requested event does not exist.'}</p>
        </div>
      </div>
    );
  }

  const isAdminOrOperator = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const userParticipant = participants.find(p => p.userId === user?.id);
  const userStatus = userParticipant?.status;

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
                    <span className="text-xs text-slate-400 font-medium block mb-1">Schedule</span>
                    <p className="text-sm text-white">{formatDate(event.startAt)} – {formatDate(event.endAt)}</p>
                  </div>
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

            {isAdminOrOperator && (
              <Section title="Participants" subtitle="Invited users and their RSVP status">
                <Card className="p-0">
                  <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">Invited Participants ({participants.length})</h3>
                    <Button onClick={() => setInviteModal(true)} className="w-full sm:w-auto">Invite Participants</Button>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {participants.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">No participants invited yet.</div>
                    ) : (
                      participants.map(p => (
                        <div key={p.id} className="p-4 hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                              {p.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{p.email}</p>
                              <p className="text-xs text-slate-400">{p.firstName} {p.lastName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge status={p.status} className={STATUS_COLORS[p.status]} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </Section>
            )}

            {!isAdminOrOperator && user && (
              <Section title="Your RSVP" subtitle="Confirm your attendance">
                <Card className="p-6">
                  {userStatus ? (
                    <div className="flex items-center gap-4">
                      <Badge status={userStatus} className={STATUS_COLORS[userStatus]} size="lg" />
                      <div>
                        <p className="font-medium text-white">You have responded</p>
                        <p className="text-sm text-slate-400">Status: {STATUS_LABELS[userStatus]}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button onClick={() => handleRsvp('ACCEPTED')} loading={rsvpLoading} variant="primary">Accept</Button>
                      <Button onClick={() => handleRsvp('DECLINED')} loading={rsvpLoading} variant="outline">Decline</Button>
                    </div>
                  )}
                </Card>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            <Section title="Quick Actions" subtitle="Event management">
              <Card className="p-4 space-y-3">
                {isAdminOrOperator && (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => setInviteModal(true)}>Invite Participants</Button>
                    <Link
                      to="/operator"
                      className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold min-h-[44px] transition-colors"
                    >
                      Open Operator Console
                    </Link>
                  </>
                )}
                {!isAdminOrOperator && user && !userStatus && (
                  <>
                    <Button variant="primary" className="w-full" onClick={() => handleRsvp('ACCEPTED')} loading={rsvpLoading}>I'll Attend</Button>
                    <Button variant="outline" className="w-full" onClick={() => handleRsvp('DECLINED')} loading={rsvpLoading}>Can't Make It</Button>
                  </>
                )}
              </Card>
            </Section>

            <Section title="Event Creator" subtitle="Contact information">
              <Card className="p-4">
                <p className="text-sm text-slate-400">Created by: {event.creator?.email || 'Unknown'}</p>
                <p className="text-sm text-slate-400 mt-1">Created: {formatDate(event.createdAt)}</p>
              </Card>
            </Section>
          </div>
        </div>

        <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Invite Participants" maxWidth="max-w-md">
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email Addresses (comma-separated)"
              multiline
              rows={4}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteModal(false)}>Cancel</Button>
              <Button type="submit" loading={inviteLoading} disabled={inviteLoading}>Send Invites</Button>
            </div>
          </form>
        </Modal>
      </PageContainer>
    </div>
  );
}