import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Alert from '../components/ui/Alert';
import { eventService } from '../services/eventService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Events() {
  useDocumentTitle('Events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    eventService
      .getAll()
      .then((r) => {
        setEvents(r.events || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Unable to load scheduled events.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-7xl">
        <PageHeader
          title="Events"
          description="Browse scheduled events and attendance check-in sessions."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <Section title="All Events" subtitle="Current schedule and active sessions">
          {loading ? (
            <LoadingState text="Loading events schedule..." />
          ) : events.length === 0 ? (
            <EmptyState
              title="No Events Available"
              description="No events are currently scheduled. Please check back later."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <Link key={evt.id} to={`/events/${evt.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl">
                <Card className="flex flex-col justify-between h-full transition-all group-hover:border-blue-500/40 group-hover:bg-slate-800/40">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-lg">{evt.name}</h3>
                      <StatusBadge status={evt.status} />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {evt.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="text-slate-200 font-medium">
                        {new Date(evt.startAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="text-slate-300">
                        {new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </PageContainer>
    </div>
  );
}
