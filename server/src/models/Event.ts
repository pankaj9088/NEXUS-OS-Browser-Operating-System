import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  userId: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  time?: string;
  category: 'work' | 'personal' | 'system' | 'deadline';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String },
    time: { type: String, default: '12:00' },
    category: {
      type: String,
      enum: ['work', 'personal', 'system', 'deadline'],
      default: 'work',
    },
  },
  { timestamps: true }
);

export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
