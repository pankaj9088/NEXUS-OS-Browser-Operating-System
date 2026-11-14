import { z } from 'zod';

// Note schemas
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
  category: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  category: z.string().optional(),
});

// File & Folder schemas
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100),
  parentFolderId: z.string().nullable().optional(),
});

export const updateFileSchema = z.object({
  filename: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  parentFolderId: z.string().nullable().optional(),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().optional(),
  startDate: z.string().min(10, 'Valid date required (YYYY-MM-DD)'),
  endDate: z.string().optional(),
  time: z.string().optional(),
  category: z.enum(['work', 'personal', 'system', 'deadline']).default('work'),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  time: z.string().optional(),
  category: z.enum(['work', 'personal', 'system', 'deadline']).optional(),
});

// Workspace schemas
export const updateWorkspaceSchema = z.object({
  wallpaper: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  accentColor: z.string().optional(),
  blurIntensity: z.enum(['low', 'medium', 'high']).optional(),
  soundEnabled: z.boolean().optional(),
  dockPosition: z.enum(['bottom', 'top']).optional(),
  dockConfiguration: z.array(z.string()).optional(),
  windowLayout: z.record(z.string(), z.unknown()).optional(),
});

// AI Chat schemas
export const chatSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  conversationId: z.string().optional(),
});
