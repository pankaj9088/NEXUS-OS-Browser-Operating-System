export type AppId = 
  | 'ai'
  | 'terminal' 
  | 'files' 
  | 'editor' 
  | 'browser' 
  | 'sysmon' 
  | 'music' 
  | 'notes' 
  | 'calc' 
  | 'calendar'
  | 'arcade' 
  | 'settings';

export type AppCategory = 'System' | 'Productivity' | 'Utilities' | 'Media' | 'Entertainment';

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: string;
  category: AppCategory;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  isSingleton?: boolean;
  pinnedToDock?: boolean;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  previousBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'system';
  app?: string;
  read: boolean;
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  size?: number; // in bytes
  updatedAt: string;
  createdAt?: string;
  fileType?: 'text' | 'image' | 'code' | 'json' | 'audio' | 'video' | 'pdf' | 'archive' | 'url';
  mimeType?: string;
  origin?: 'sample' | 'uploaded';
  dataUrl?: string;
}

export type AccentColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
export type ThemeMode = 'dark' | 'light';

export interface SystemSettings {
  wallpaper: string;
  customWallpapers?: string[];
  themeMode: ThemeMode;
  accentColor: AccentColor;
  soundEnabled: boolean;
  blurIntensity: 'low' | 'medium' | 'high';
  animationsEnabled: boolean;
  clockFormat: '12h' | '24h';
  showSeconds: boolean;
  dockPosition: 'bottom' | 'top';
  isLocked: boolean;
  username: string;
  avatarIcon?: string;
}

export interface ContextMenuItem {
  label?: string;
  icon?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

// Calendar event type
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: 'work' | 'personal' | 'system' | 'deadline';
  description?: string;
}

// AI Message and conversation types
export interface AIMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  source?: 'cloud-ai' | 'local-simulation';
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}
