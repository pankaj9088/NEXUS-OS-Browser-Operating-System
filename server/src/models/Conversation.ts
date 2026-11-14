import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  source?: 'cloud-ai' | 'local-simulation';
}

export interface IConversation extends Document {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['ai', 'user'], required: true },
    text: { type: String, default: '' },
    timestamp: { type: Number, default: () => Date.now() },
    source: { type: String, default: 'cloud-ai' },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export const ConversationModel =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
