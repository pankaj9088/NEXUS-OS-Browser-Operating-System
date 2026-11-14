import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../config/env';

const BASE_UPLOAD_DIR = path.resolve(process.cwd(), ENV.UPLOAD_DIR);

// Ensure upload directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
}

export const fileStorageService = {
  // Generate cryptographically safe storage key preventing directory traversal
  generateSafeKey(userId: string, originalFilename: string): { storageKey: string; safeFilename: string } {
    const ext = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanBasename = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeFilename = `${cleanBasename}${ext}`;
    const storageKey = `${userId}_${randomHex}${ext}`;
    return { storageKey, safeFilename };
  },

  getFilePath(storageKey: string): string | null {
    // Prevent directory traversal
    const safeKey = path.basename(storageKey);
    const resolvedPath = path.resolve(BASE_UPLOAD_DIR, safeKey);
    if (!resolvedPath.startsWith(BASE_UPLOAD_DIR)) {
      return null;
    }
    return resolvedPath;
  },

  async saveFile(storageKey: string, buffer: Buffer): Promise<void> {
    const filePath = this.getFilePath(storageKey);
    if (!filePath) throw new Error('Path traversal detected');
    await fs.promises.writeFile(filePath, buffer);
  },

  async readFile(storageKey: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(storageKey);
    if (!filePath || !fs.existsSync(filePath)) return null;
    return fs.promises.readFile(filePath);
  },

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = this.getFilePath(storageKey);
    if (!filePath || !fs.existsSync(filePath)) return false;
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  },
};
