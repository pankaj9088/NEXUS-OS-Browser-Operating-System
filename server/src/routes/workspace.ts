import { Router, Request, Response } from 'express';
import { db, WorkspaceRecord } from '../store/memoryDb';
import { authenticateUser } from './auth';
import { updateWorkspaceSchema } from '../schemas/appSchemas';

export const workspaceRouter = Router();

const DEFAULT_DOCK_CONFIG = [
  'ai', 'terminal', 'files', 'editor', 'browser', 'calendar',
  'sysmon', 'music', 'arcade', 'notes', 'calc'
];

// GET /api/workspace - Retrieve user workspace preferences
workspaceRouter.get('/', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';

  let workspace = db.workspaces.find((w) => w.userId === userId);

  if (!workspace) {
    workspace = {
      id: `ws-${userId}`,
      userId,
      wallpaper: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg',
      theme: 'dark',
      accentColor: 'cyan',
      blurIntensity: 'high',
      soundEnabled: true,
      dockPosition: 'bottom',
      dockConfiguration: DEFAULT_DOCK_CONFIG,
      windowLayout: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.workspaces.push(workspace);
    db.saveWorkspaces();
  }

  return res.json({ workspace });
});

// PATCH /api/workspace - Update user workspace preferences
workspaceRouter.patch('/', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';

  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  let workspace = db.workspaces.find((w) => w.userId === userId);

  if (!workspace) {
    workspace = {
      id: `ws-${userId}`,
      userId,
      wallpaper: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg',
      theme: 'dark',
      accentColor: 'cyan',
      blurIntensity: 'high',
      soundEnabled: true,
      dockPosition: 'bottom',
      dockConfiguration: DEFAULT_DOCK_CONFIG,
      windowLayout: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.workspaces.push(workspace);
  }

  const updates = parsed.data;
  if (updates.wallpaper !== undefined) workspace.wallpaper = updates.wallpaper;
  if (updates.theme !== undefined) workspace.theme = updates.theme;
  if (updates.accentColor !== undefined) workspace.accentColor = updates.accentColor;
  if (updates.blurIntensity !== undefined) workspace.blurIntensity = updates.blurIntensity;
  if (updates.soundEnabled !== undefined) workspace.soundEnabled = updates.soundEnabled;
  if (updates.dockPosition !== undefined) workspace.dockPosition = updates.dockPosition;
  if (updates.dockConfiguration !== undefined) workspace.dockConfiguration = updates.dockConfiguration;
  if (updates.windowLayout !== undefined) workspace.windowLayout = updates.windowLayout;

  workspace.updatedAt = Date.now();
  db.saveWorkspaces();

  return res.json({ workspace });
});
