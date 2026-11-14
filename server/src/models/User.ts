import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  displayName: string;
  email: string;
  passwordHash: string;
  preferences: {
    themeMode: 'dark' | 'light';
    accentColor: string;
    wallpaper: string;
    soundEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    preferences: {
      themeMode: { type: String, enum: ['dark', 'light'], default: 'dark' },
      accentColor: { type: String, default: 'cyan' },
      wallpaper: { type: String, default: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg' },
      soundEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
