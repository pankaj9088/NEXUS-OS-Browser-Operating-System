import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: number;
}

export interface NoteRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileRecord {
  id: string;
  userId: string;
  name: string;
  size: number;
  mimeType: string;
  path: string;
  content?: string;
  parentFolderId?: string | null;
  isFolder?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface WorkspaceRecord {
  id: string;
  userId: string;
  wallpaper: string;
  theme: 'dark' | 'light';
  accentColor: string;
  blurIntensity: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  dockPosition: 'bottom' | 'top';
  dockConfiguration: string[];
  windowLayout: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface EventRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  time?: string;
  category: 'work' | 'personal' | 'system' | 'deadline';
  createdAt: number;
  updatedAt: number;
}

export interface AIMessageRecord {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  source?: 'cloud-ai' | 'local-simulation';
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  messages: AIMessageRecord[];
  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.nexus_data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const FILES_META = path.join(DATA_DIR, 'files.json');
const WORKSPACES_FILE = path.join(DATA_DIR, 'workspaces.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    ensureDir();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`[Nexus DB] Notice: Could not read ${file}, using default.`);
  }
  return fallback;
}

function saveJson<T>(file: string, data: T) {
  try {
    ensureDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write JSON store:', err);
  }
}

class MemoryDb {
  public users: UserRecord[] = [];
  public notes: NoteRecord[] = [];
  public files: FileRecord[] = [];
  public workspaces: WorkspaceRecord[] = [];
  public events: EventRecord[] = [];
  public conversations: ConversationRecord[] = [];

  constructor() {
    this.users = loadJson<UserRecord[]>(USERS_FILE, [
      {
        id: 'usr_guest',
        email: 'guest@nexusos.internal',
        passwordHash: '',
        displayName: 'Guest Operator',
        avatar: 'user',
        role: 'guest',
        createdAt: Date.now(),
      },
    ]);

    this.notes = loadJson<NoteRecord[]>(NOTES_FILE, [
      {
        id: 'note-welcome',
        userId: 'usr_guest',
        title: 'Welcome to Nexus OS',
        content: '# NEXUS OS Architecture\n\nA full-stack browser-based operating system designed for multitasking.\n\n- Multi-window compositing\n- Integrated Gemini AI Copilot\n- Virtual filesystem & terminal\n- Neon arcade emulator & music synth',
        color: 'cyan',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    this.files = loadJson<FileRecord[]>(FILES_META, []);
    this.workspaces = loadJson<WorkspaceRecord[]>(WORKSPACES_FILE, []);
    this.events = loadJson<EventRecord[]>(EVENTS_FILE, [
      {
        id: 'evt-welcome',
        userId: 'usr_guest',
        title: 'Nexus OS System Initialization',
        description: 'First boot sequence and diagnostic audit',
        startDate: new Date().toISOString().split('T')[0],
        time: '09:00',
        category: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    this.conversations = loadJson<ConversationRecord[]>(CONVERSATIONS_FILE, []);
  }

  public saveUsers() {
    saveJson(USERS_FILE, this.users);
  }

  public saveNotes() {
    saveJson(NOTES_FILE, this.notes);
  }

  public saveFiles() {
    saveJson(FILES_META, this.files);
  }

  public saveWorkspaces() {
    saveJson(WORKSPACES_FILE, this.workspaces);
  }

  public saveEvents() {
    saveJson(EVENTS_FILE, this.events);
  }

  public saveConversations() {
    saveJson(CONVERSATIONS_FILE, this.conversations);
  }
}

export const db = new MemoryDb();
