import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { ENV } from '../config/env';

// Prohibit executable extensions
const BANNED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.php', '.pl', '.cgi', '.py', '.msi', '.vbs', '.com'
]);

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // 25 MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (BANNED_EXTENSIONS.has(ext)) {
      cb(new Error(`File extension "${ext}" is not permitted for security reasons.`));
      return;
    }

    cb(null, true);
  },
});
