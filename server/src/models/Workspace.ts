import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  userId: string;
  wallpaper: string;
  theme: 'dark' | 'light';
  accentColor: string;
  blurIntensity: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  dockPosition: 'bottom' | 'top';
  dockConfiguration: string[];
  windowLayout: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    wallpaper: { type: String, default: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    accentColor: { type: String, default: 'cyan' },
    blurIntensity: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
    soundEnabled: { type: Boolean, default: true },
    dockPosition: { type: String, enum: ['bottom', 'top'], default: 'bottom' },
    dockConfiguration: {
      type: [String],
      default: ['ai', 'terminal', 'files', 'editor', 'browser', 'calendar', 'sysmon', 'music', 'arcade', 'notes', 'calc'],
    },
    windowLayout: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const WorkspaceModel =
  mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
