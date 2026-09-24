import { beforeEach, describe, expect, it, vi } from 'vitest';

const repos = vi.hoisted(() => ({
  events: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  participants: {
    isInvited: vi.fn(),
  },
}));

vi.mock('../src/repositories/event.repository.js', () => ({ eventRepository: repos.events }));
vi.mock('../src/repositories/eventParticipants.repository.js', () => ({ eventParticipantsRepository: repos.participants }));
vi.mock('../src/services/audit.service.js', () => ({ auditService: { log: vi.fn().mockResolvedValue({}) } }));

const { eventService } = await import('../src/services/event.service.js');

const user = { id: 10, role: 'USER' };
const operator = { id: 20, role: 'OPERATOR' };
const admin = { id: 30, role: 'ADMIN' };

const publicEvent = {
  id: 1,
  name: 'Public Event',
  visibility: 'PUBLIC',
  status: 'DRAFT',
  startAt: '2099-01-01T00:00:00.000Z',
  endAt: '2099-01-01T02:00:00.000Z',
};

const inviteOnlyEvent = {
  id: 2,
  name: 'Required Event',
  visibility: 'INVITE_ONLY',
  status: 'DRAFT',
  startAt: '2099-01-02T00:00:00.000Z',
  endAt: '2099-01-02T02:00:00.000Z',
};

describe('v1.2 event visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repos.events.findAll.mockResolvedValue([publicEvent, inviteOnlyEvent]);
    repos.events.findById.mockImplementation(async (id) => (id === 1 ? publicEvent : id === 2 ? inviteOnlyEvent : null));
    repos.events.update.mockImplementation(async (_id, fields) => ({ ...inviteOnlyEvent, ...fields }));
    repos.participants.isInvited.mockResolvedValue(false);
  });

  it('shows PUBLIC events to a normal user and hides unrelated invite-only events', async () => {
    const events = await eventService.listEvents(user, new Date('2098-12-01T00:00:00Z').getTime());
    expect(events.map((event) => event.id)).toEqual([1]);
  });

  it('shows an invite-only event to an invited user', async () => {
    repos.participants.isInvited.mockImplementation(async (eventId, userId) => eventId === 2 && userId === user.id);
    const events = await eventService.listEvents(user, new Date('2098-12-01T00:00:00Z').getTime());
    expect(events.map((event) => event.id)).toEqual([1, 2]);
    expect(events.find((event) => event.id === 2)?.viewerInvited).toBe(true);
  });

  it('shows all events to OPERATOR and ADMIN staff', async () => {
    await expect(eventService.listEvents(operator, new Date('2098-12-01T00:00:00Z').getTime())).resolves.toHaveLength(2);
    await expect(eventService.listEvents(admin, new Date('2098-12-01T00:00:00Z').getTime())).resolves.toHaveLength(2);
    expect(repos.participants.isInvited).not.toHaveBeenCalled();
  });

  it('returns not found for an uninvited user requesting invite-only event detail', async () => {
    await expect(eventService.getEvent(2, user, new Date('2098-12-01T00:00:00Z').getTime()))
      .rejects.toMatchObject({ code: 'EVENT_NOT_FOUND', status: 404 });
  });

  it('allows an invited user to view invite-only event detail', async () => {
    repos.participants.isInvited.mockResolvedValue(true);
    await expect(eventService.getEvent(2, user, new Date('2098-12-01T00:00:00Z').getTime()))
      .resolves.toMatchObject({ id: 2, visibility: 'INVITE_ONLY', viewerInvited: true });
  });

  it('keeps event creation restricted to ADMIN', async () => {
    await expect(eventService.createEvent({
      name: 'Required',
      visibility: 'INVITE_ONLY',
      startAt: '2099-01-01T00:00:00.000Z',
      endAt: '2099-01-01T01:00:00.000Z',
    }, operator)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
