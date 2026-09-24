import { eventService } from '../services/event.service.js';

const id = (value) => Number.parseInt(value, 10);

export const eventController = {
  async getAll(req, res, next) {
    try {
      res.json({ events: await eventService.listEvents(req.user) });
    } catch (e) { next(e); }
  },

  async getById(req, res, next) {
    try {
      res.json({ event: await eventService.getEvent(id(req.params.id), req.user) });
    } catch (e) { next(e); }
  },

  async create(req, res, next) {
    try {
      res.status(201).json({ event: await eventService.createEvent(req.validated, req.user) });
    } catch (e) { next(e); }
  },

  async update(req, res, next) {
    try {
      res.json({ event: await eventService.updateEvent(id(req.params.id), req.validated, req.user) });
    } catch (e) { next(e); }
  },
};
