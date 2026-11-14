import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  userId: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  parentFolderId: string | null;
  isFolder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true, trim: true },
    storageKey: { type: String, default: '' },
    mimeType: { type: String, default: 'text/plain' },
    size: { type: Number, default: 0 },
    parentFolderId: { type: String, default: null, index: true },
    isFolder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
