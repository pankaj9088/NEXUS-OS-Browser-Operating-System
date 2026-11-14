import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, NoteRecord } from '../store/memoryDb';
import { authenticateUser } from './auth';

export const notesRouter = Router();

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().default(''),
  color: z.string().optional().default('cyan'),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/notes - List notes for user
notesRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userNotes = db.notes.filter((n) => n.userId === user?.id || (user?.role === 'guest' && n.userId === 'usr_guest'));
  return res.json({ notes: userNotes });
});

// GET /api/notes/:id - Get single note
notesRouter.get('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const note = db.notes.find((n) => n.id === id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const isOwner = note.userId === user?.id || (user?.role === 'guest' && note.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this note' });
  }

  return res.json({ note });
});

// POST /api/notes - Create note
notesRouter.post('/', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid note payload', details: parsed.error.issues });
  }

  const newNote: NoteRecord = {
    id: `note-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    userId: user?.id || 'usr_guest',
    title: parsed.data.title,
    content: parsed.data.content,
    color: parsed.data.color,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.notes.unshift(newNote);
  db.saveNotes();

  return res.status(201).json({ note: newNote });
});

// Handle update for both PUT and PATCH
const handleUpdateNote = (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const note = db.notes.find((n) => n.id === id);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const isOwner = note.userId === user?.id || (user?.role === 'guest' && note.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this note' });
  }

  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid note payload', details: parsed.error.issues });
  }

  if (parsed.data.title !== undefined) note.title = parsed.data.title;
  if (parsed.data.content !== undefined) note.content = parsed.data.content;
  if (parsed.data.color !== undefined) note.color = parsed.data.color;
  note.updatedAt = Date.now();

  db.saveNotes();
  return res.json({ note });
};

// PUT /api/notes/:id
notesRouter.put('/:id', authenticateUser, handleUpdateNote);

// PATCH /api/notes/:id
notesRouter.patch('/:id', authenticateUser, handleUpdateNote);

// DELETE /api/notes/:id
notesRouter.delete('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const index = db.notes.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const note = db.notes[index];
  const isOwner = note.userId === user?.id || (user?.role === 'guest' && note.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this note' });
  }

  db.notes.splice(index, 1);
  db.saveNotes();

  return res.json({ success: true, message: 'Note deleted' });
});
