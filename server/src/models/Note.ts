import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  userId: string;
  title: string;
  content: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'Untitled Note', trim: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
);

export const NoteModel = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
