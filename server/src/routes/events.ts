import { Router, Request, Response } from 'express';
import { db, EventRecord } from '../store/memoryDb';
import { authenticateUser } from './auth';
import { createEventSchema, updateEventSchema } from '../schemas/appSchemas';

export const eventsRouter = Router();

// GET /api/events - List events for user
eventsRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';

  const userEvents = db.events
    .filter((e) => e.userId === userId || (user?.role === 'guest' && e.userId === 'usr_guest'))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return res.json({ events: userEvents });
});

// POST /api/events - Create new event
eventsRouter.post('/', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';

  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const { title, description, startDate, endDate, time, category } = parsed.data;

  const newEvent: EventRecord = {
    id: `evt-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    userId,
    title,
    description: description || '',
    startDate,
    endDate,
    time: time || '12:00',
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.events.push(newEvent);
  db.saveEvents();

  return res.status(201).json({ event: newEvent });
});

// PATCH /api/events/:id - Update an existing event
eventsRouter.patch('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;

  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const event = db.events.find((e) => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const isOwner = event.userId === user?.id || (user?.role === 'guest' && event.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this event' });
  }

  const updates = parsed.data;
  if (updates.title !== undefined) event.title = updates.title;
  if (updates.description !== undefined) event.description = updates.description;
  if (updates.startDate !== undefined) event.startDate = updates.startDate;
  if (updates.endDate !== undefined) event.endDate = updates.endDate;
  if (updates.time !== undefined) event.time = updates.time;
  if (updates.category !== undefined) event.category = updates.category;

  event.updatedAt = Date.now();
  db.saveEvents();

  return res.json({ event });
});

// DELETE /api/events/:id - Delete an event
eventsRouter.delete('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;

  const index = db.events.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const event = db.events[index];
  const isOwner = event.userId === user?.id || (user?.role === 'guest' && event.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this event' });
  }

  db.events.splice(index, 1);
  db.saveEvents();

  return res.json({ success: true, message: 'Event deleted' });
});
