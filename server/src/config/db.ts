import mongoose from 'mongoose';
import { ENV } from './env';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (!ENV.MONGODB_URI) {
    console.log('[Nexus DB] No MONGODB_URI configured. Running with in-memory persistence fallback.');
    return;
  }

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Nexus DB] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn('[Nexus DB] MongoDB connection error:', (error as Error).message);
    console.log('[Nexus DB] Operating with in-memory fallback adapter.');
  }
}

export function isDBConnected(): boolean {
  return isConnected;
}
