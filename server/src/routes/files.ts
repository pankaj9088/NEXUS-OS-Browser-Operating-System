import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, FileRecord } from '../store/memoryDb';
import { authenticateUser } from './auth';
import { createFolderSchema, updateFileSchema } from '../schemas/appSchemas';

export const filesRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), '.nexus_data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Banned executable & dangerous file extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.vbs', '.com',
  '.scr', '.pif', '.reg', '.ps1', '.apk', '.jar', '.iso', '.dmg',
  '.dll', '.sys', '.app', '.action', '.command'
]);

// Allowed safe extensions
const ALLOWED_EXTENSIONS = new Set([
  // Text & Code
  '.txt', '.md', '.markdown', '.json', '.csv', '.log', '.xml', '.yaml', '.yml',
  '.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.py', '.c', '.cpp', '.java',
  '.rs', '.sql', '.env', '.ini', '.conf',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf',
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico',
  // Audio
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac',
  // Video
  '.mp4', '.webm', '.ogv', '.mov', '.mkv',
  // Archives
  '.zip', '.tar', '.gz', '.7z'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit strictly enforced
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // 1. Check for dangerous extension
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      cb(new Error(`File extension "${ext}" is blocked for security reasons.`));
      return;
    }

    // 2. Check allowlist
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error(`File extension "${ext}" is not permitted. Only supported document, media, and code formats are allowed.`));
      return;
    }

    // 3. MIME type checks
    const mime = file.mimetype.toLowerCase();
    const isSafeMime =
      mime.startsWith('text/') ||
      mime.startsWith('image/') ||
      mime.startsWith('audio/') ||
      mime.startsWith('video/') ||
      mime === 'application/json' ||
      mime === 'application/pdf' ||
      mime === 'application/zip' ||
      mime === 'application/x-zip-compressed' ||
      mime === 'application/gzip' ||
      mime === 'application/x-tar' ||
      mime === 'application/xml' ||
      mime === 'application/javascript' ||
      mime === 'application/typescript' ||
      mime === 'application/msword' ||
      mime.includes('officedocument') ||
      mime === 'application/octet-stream';

    if (!isSafeMime) {
      cb(new Error(`MIME type "${file.mimetype}" is not permitted.`));
      return;
    }

    cb(null, true);
  },
});

// Middleware to catch Multer errors and return proper HTTP 413 and 400 responses
const handleSingleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File size exceeds maximum 10MB limit.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Invalid file upload.' });
    }
    next();
  });
};

// GET /api/files - List files and folders for authenticated user
filesRouter.get('/', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user;
  const parentFolderId = req.query.parentFolderId !== undefined
    ? (req.query.parentFolderId === 'null' ? null : String(req.query.parentFolderId))
    : undefined;

  let userFiles = db.files.filter((f) => f.userId === user?.id || (user?.role === 'guest' && f.userId === 'usr_guest'));

  if (parentFolderId !== undefined) {
    userFiles = userFiles.filter((f) => (f.parentFolderId || null) === parentFolderId);
  }

  return res.json({ files: userFiles });
});

// POST /api/files/upload - Upload file with validation
filesRouter.post('/upload', authenticateUser, handleSingleUpload, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const parentFolderId = req.body.parentFolderId ? String(req.body.parentFolderId) : null;

  let textPreview = '';
  if (
    file.mimetype.startsWith('text/') ||
    file.mimetype.includes('json') ||
    file.mimetype.includes('javascript') ||
    file.mimetype.includes('typescript')
  ) {
    try {
      textPreview = fs.readFileSync(file.path, 'utf-8').slice(0, 10000);
    } catch {
      // Ignore
    }
  }

  const record: FileRecord = {
    id: `file-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    userId: user?.id || 'usr_guest',
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    path: file.path,
    content: textPreview,
    parentFolderId,
    isFolder: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.files.push(record);
  db.saveFiles();

  return res.status(201).json({ file: record });
});

// POST /api/files/folders - Create virtual folder
filesRouter.post('/folders', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const parsed = createFolderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const { name, parentFolderId } = parsed.data;

  const folderRecord: FileRecord = {
    id: `folder-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    userId: user?.id || 'usr_guest',
    name,
    size: 0,
    mimeType: 'inode/directory',
    path: '',
    parentFolderId: parentFolderId || null,
    isFolder: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.files.push(folderRecord);
  db.saveFiles();

  return res.status(201).json({ folder: folderRecord });
});

// PATCH /api/files/:id - Update/rename/move file or folder
filesRouter.patch('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;

  const parsed = updateFileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const file = db.files.find((f) => f.id === id);
  if (!file) {
    return res.status(404).json({ error: 'File or folder not found' });
  }

  const isOwner = file.userId === user?.id || (user?.role === 'guest' && file.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this item' });
  }

  const newName = (req.body.name || req.body.filename);
  if (newName && typeof newName === 'string') {
    file.name = newName.trim();
  }

  if (req.body.parentFolderId !== undefined) {
    file.parentFolderId = req.body.parentFolderId === null ? null : String(req.body.parentFolderId);
  }

  file.updatedAt = Date.now();
  db.saveFiles();

  return res.json({ file });
});

// GET /api/files/:id/download - Authorized file download with strict ownership verification
filesRouter.get('/:id/download', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const record = db.files.find((f) => f.id === id);

  if (!record || !record.path || !fs.existsSync(record.path)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  // Strict ownership check: Must be owner or admin
  const isOwner = record.userId === user?.id || (user?.role === 'guest' && record.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Access denied: You do not own this file' });
  }

  return res.download(record.path, record.name);
});

// GET /api/files/:id/view - Stream/view file with proper Content-Type for preview & media playback
filesRouter.get('/:id/view', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const record = db.files.find((f) => f.id === id);

  if (!record || !record.path || !fs.existsSync(record.path)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  const isOwner = record.userId === user?.id || (user?.role === 'guest' && record.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Access denied: You do not own this file' });
  }

  if (record.mimeType) {
    res.setHeader('Content-Type', record.mimeType);
  }
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.name)}"`);
  return res.sendFile(record.path);
});

// DELETE /api/files/:id - Delete file or folder with recursive ownership verification
filesRouter.delete('/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;
  const index = db.files.findIndex((f) => f.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  const record = db.files[index];
  const isOwner = record.userId === user?.id || (user?.role === 'guest' && record.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this file' });
  }

  // If deleting a folder, gather all descendant items to remove
  const idsToDelete = new Set<string>([record.id]);
  if (record.isFolder) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of db.files) {
        if (item.parentFolderId && idsToDelete.has(item.parentFolderId) && !idsToDelete.has(item.id)) {
          idsToDelete.add(item.id);
          changed = true;
        }
      }
    }
  }

  // Remove files from disk
  for (const item of db.files) {
    if (idsToDelete.has(item.id) && item.path && fs.existsSync(item.path)) {
      try {
        fs.unlinkSync(item.path);
      } catch (err) {
        console.error('Failed to unlink file on disk:', err);
      }
    }
  }

  // Filter out all deleted ids
  db.files = db.files.filter((f) => !idsToDelete.has(f.id));
  db.saveFiles();

  return res.json({ success: true, message: record.isFolder ? 'Folder and contents deleted' : 'File deleted' });
});
