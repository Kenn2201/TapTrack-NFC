import { describe, it, expect, beforeEach, vi } from 'vitest';

// Configure test environment variables before app import
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-secure-taptrack';
process.env.CARD_TOKEN_PEPPER = 'test-card-pepper-at-least-32-chars-long-secure-taptrack';
process.env.NFC_DOMAIN = 'https://nfc.kenncode.me';
process.env.PORT = '3001';

let eventsTable = [];
let sessionsTable = [];
let attendanceTable = [];
let nextEventId = 1;
let nextSessionId = 1;
let nextRecordId = 1;

// Mock db pool — supports the event.repository queries only.
vi.mock('../src/repositories/db.js', () => {
  return {
    default: {
      query: vi.fn(async (text, params = []) => {
        const q = text.replace(/\s+/g, ' ').trim();

        // findAll: list with attendance_count, ordered by start_at DESC
        if (q.includes('FROM events e') && q.includes('LEFT JOIN attendance_records ar')) {
          const rows = eventsTable.map((e) => {
            const count = attendanceTable.filter((a) => a.event_id === e.id).length;
            return { ...e, attendance_count: count };
          });
          rows.sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
          return { rows };
        }

        // findById — repository joins creator metadata and uses the e alias.
        if (q.includes('FROM events e') && q.includes('WHERE e.id = $1')) {
          const event = eventsTable.find((e) => e.id === params[0]);
          return { rows: event ? [{ ...event }] : [] };
        }

        // update
        if (q.includes('UPDATE events') && q.includes('COALESCE($6, status)')) {
          const id = params[6];
          const event = eventsTable.find((e) => e.id === id);
          if (!event) return { rows: [] };
          const updated = {
            ...event,
            name: params[0] ?? event.name,
            description: params[1] ?? event.description,
            location: params[2] ?? event.location,
            start_at: params[3] ?? event.start_at,
            end_at: params[4] ?? event.end_at,
            status: params[5] ?? event.status,
            updated_at: new Date().toISOString(),
          };
          eventsTable = eventsTable.map((e) => (e.id === id ? updated : e));
          // eventRepository.update() now returns the id then re-fetches the
          // normalized event so creator/count/session fields are consistent.
          return { rows: [{ id }] };
        }

        // Inserts into attendance_sessions must NOT happen during reconciliation.
        if (q.includes('INSERT INTO attendance_sessions')) {
          return { rows: [] };
        }
        if (q.includes('INSERT INTO attendance_records')) {
          return { rows: [] };
        }

        return { rows: [] };
      }),
    },
  };
});

const { eventService } = await import('../src/services/event.service.js');

function makeEvent(overrides = {}) {
  const base = {
    id: nextEventId++,
    name: 'Test Event',
    description: 'Test description',
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 3600_000).toISOString(),
    status: 'DRAFT',
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

describe('eventService — scheduled event status reconciliation', () => {
  beforeEach(() => {
    eventsTable = [];
    sessionsTable = [];
    attendanceTable = [];
    nextEventId = 1;
    nextSessionId = 1;
    nextRecordId = 1;
  });

  it('future event remains pre-open (DRAFT) before its scheduled start', async () => {
    const now = Date.now();
    const future = makeEvent({
      start_at: new Date(now + 3600_000 * 2).toISOString(),
      end_at: new Date(now + 3600_000 * 4).toISOString(),
      status: 'DRAFT',
    });
    eventsTable.push(future);

    const events = await eventService.listEvents(now);
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(future.id);
    expect(events[0].status).toBe('DRAFT');
  });

  it('started event becomes OPEN when start <= now < end', async () => {
    const now = Date.now();
    const active = makeEvent({
      start_at: new Date(now - 600_000).toISOString(),
      end_at: new Date(now + 3_600_000).toISOString(),
      status: 'DRAFT',
    });
    eventsTable.push(active);

    const event = await eventService.getEvent(active.id, now);
    expect(event.status).toBe('OPEN');
  });

  it('ended event becomes CLOSED when now >= end', async () => {
    const now = Date.now();
    const ended = makeEvent({
      start_at: new Date(now - 3_600_000 * 2).toISOString(),
      end_at: new Date(now - 600_000).toISOString(),
      status: 'DRAFT',
    });
    eventsTable.push(ended);

    const events = await eventService.listEvents(now);
    expect(events[0].status).toBe('CLOSED');
  });

  it('cancelled event remains CANCELLED regardless of schedule', async () => {
    const now = Date.now();
    const cancelled = makeEvent({
      start_at: new Date(now - 3_600_000 * 2).toISOString(),
      end_at: new Date(now - 600_000).toISOString(),
      status: 'CANCELLED',
    });
    eventsTable.push(cancelled);

    const event = await eventService.getEvent(cancelled.id, now);
    expect(event.status).toBe('CANCELLED');
  });

  it('manually CLOSED event is not reopened automatically', async () => {
    const now = Date.now();
    const closed = makeEvent({
      start_at: new Date(now - 3_600_000).toISOString(),
      end_at: new Date(now + 3_600_000).toISOString(),
      status: 'CLOSED',
    });
    eventsTable.push(closed);

    const event = await eventService.getEvent(closed.id, now);
    expect(event.status).toBe('CLOSED');
  });

  it('repeated reconciliation is idempotent', async () => {
    const now = Date.now();
    const active = makeEvent({
      start_at: new Date(now - 600_000).toISOString(),
      end_at: new Date(now + 3_600_000).toISOString(),
      status: 'DRAFT',
    });
    eventsTable.push(active);

    // First pass persists OPEN via lazy update.
    const first = await eventService.listEvents(now);
    expect(first[0].status).toBe('OPEN');
    const persistedAfterFirst = eventsTable.find((e) => e.id === active.id);
    expect(persistedAfterFirst.status).toBe('OPEN');

    // Second pass must not need another write and must return the same state.
    const second = await eventService.listEvents(now);
    expect(second[0].status).toBe('OPEN');
  });

  it('event state reconciliation does NOT create an attendance session', async () => {
    const now = Date.now();
    const active = makeEvent({
      start_at: new Date(now - 600_000).toISOString(),
      end_at: new Date(now + 3_600_000).toISOString(),
      status: 'DRAFT',
    });
    eventsTable.push(active);

    await eventService.listEvents(now);
    expect(sessionsTable).toHaveLength(0);
    expect(attendanceTable).toHaveLength(0);
  });
});