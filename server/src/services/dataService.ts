import { UserModel, IUser } from '../models/User';
import { NoteModel, INote } from '../models/Note';
import { FileModel, IFile } from '../models/File';
import { ConversationModel, IConversation } from '../models/Conversation';
import { EventModel, IEvent } from '../models/Event';
import { WorkspaceModel, IWorkspace } from '../models/Workspace';
import { isDBConnected } from '../config/db';

// In-Memory store fallback
const memoryStore = {
  users: new Map<string, any>(),
  notes: new Map<string, any>(),
  files: new Map<string, any>(),
  conversations: new Map<string, any>(),
  events: new Map<string, any>(),
  workspaces: new Map<string, any>(),
};

export const dataService = {
  // --- USERS ---
  async findUserByEmail(email: string) {
    if (isDBConnected()) {
      return UserModel.findOne({ email: email.toLowerCase() });
    }
    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  },

  async findUserById(id: string) {
    if (isDBConnected()) {
      return UserModel.findById(id);
    }
    return memoryStore.users.get(id) || null;
  },

  async createUser(data: { displayName: string; email: string; passwordHash: string }) {
    if (isDBConnected()) {
      return UserModel.create(data);
    }
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user = {
      _id: id,
      id,
      ...data,
      preferences: {
        themeMode: 'dark',
        accentColor: 'cyan',
        wallpaper: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg',
        soundEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.set(id, user);
    return user;
  },

  // --- NOTES ---
  async getNotes(userId: string) {
    if (isDBConnected()) {
      return NoteModel.find({ userId }).sort({ updatedAt: -1 });
    }
    return Array.from(memoryStore.notes.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getNoteById(id: string, userId: string) {
    if (isDBConnected()) {
      return NoteModel.findOne({ _id: id, userId });
    }
    const note = memoryStore.notes.get(id);
    return note && note.userId === userId ? note : null;
  },

  async createNote(data: { userId: string; title: string; content: string; category?: string }) {
    if (isDBConnected()) {
      return NoteModel.create(data);
    }
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const note = {
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.notes.set(id, note);
    return note;
  },

  async updateNote(id: string, userId: string, updates: Partial<{ title: string; content: string; category: string }>) {
    if (isDBConnected()) {
      return NoteModel.findOneAndUpdate({ _id: id, userId }, { ...updates, updatedAt: new Date() }, { new: true });
    }
    const note = memoryStore.notes.get(id);
    if (!note || note.userId !== userId) return null;
    const updated = { ...note, ...updates, updatedAt: new Date() };
    memoryStore.notes.set(id, updated);
    return updated;
  },

  async deleteNote(id: string, userId: string) {
    if (isDBConnected()) {
      return NoteModel.findOneAndDelete({ _id: id, userId });
    }
    const note = memoryStore.notes.get(id);
    if (note && note.userId === userId) {
      memoryStore.notes.delete(id);
      return note;
    }
    return null;
  },

  // --- FILES ---
  async getFiles(userId: string, parentFolderId: string | null = null) {
    if (isDBConnected()) {
      return FileModel.find({ userId, parentFolderId }).sort({ isFolder: -1, filename: 1 });
    }
    return Array.from(memoryStore.files.values())
      .filter((f) => f.userId === userId && f.parentFolderId === parentFolderId)
      .sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0));
  },

  async getFileById(id: string, userId: string) {
    if (isDBConnected()) {
      return FileModel.findOne({ _id: id, userId });
    }
    const file = memoryStore.files.get(id);
    return file && file.userId === userId ? file : null;
  },

  async createFile(data: {
    userId: string;
    filename: string;
    storageKey?: string;
    mimeType?: string;
    size?: number;
    parentFolderId?: string | null;
    isFolder?: boolean;
  }) {
    if (isDBConnected()) {
      return FileModel.create(data);
    }
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const file = {
      _id: id,
      id,
      ...data,
      storageKey: data.storageKey || '',
      mimeType: data.mimeType || 'text/plain',
      size: data.size || 0,
      parentFolderId: data.parentFolderId || null,
      isFolder: !!data.isFolder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.files.set(id, file);
    return file;
  },

  async updateFile(id: string, userId: string, updates: Partial<{ filename: string; parentFolderId: string | null }>) {
    if (isDBConnected()) {
      return FileModel.findOneAndUpdate({ _id: id, userId }, { ...updates, updatedAt: new Date() }, { new: true });
    }
    const file = memoryStore.files.get(id);
    if (!file || file.userId !== userId) return null;
    const updated = { ...file, ...updates, updatedAt: new Date() };
    memoryStore.files.set(id, updated);
    return updated;
  },

  async deleteFile(id: string, userId: string) {
    if (isDBConnected()) {
      return FileModel.findOneAndDelete({ _id: id, userId });
    }
    const file = memoryStore.files.get(id);
    if (file && file.userId === userId) {
      memoryStore.files.delete(id);
      return file;
    }
    return null;
  },

  // --- EVENTS ---
  async getEvents(userId: string) {
    if (isDBConnected()) {
      return EventModel.find({ userId }).sort({ startDate: 1 });
    }
    return Array.from(memoryStore.events.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  async createEvent(data: {
    userId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    time?: string;
    category?: string;
  }) {
    if (isDBConnected()) {
      return EventModel.create(data);
    }
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const event = {
      _id: id,
      id,
      ...data,
      time: data.time || '12:00',
      category: data.category || 'work',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.events.set(id, event);
    return event;
  },

  async updateEvent(id: string, userId: string, updates: Partial<any>) {
    if (isDBConnected()) {
      return EventModel.findOneAndUpdate({ _id: id, userId }, { ...updates, updatedAt: new Date() }, { new: true });
    }
    const event = memoryStore.events.get(id);
    if (!event || event.userId !== userId) return null;
    const updated = { ...event, ...updates, updatedAt: new Date() };
    memoryStore.events.set(id, updated);
    return updated;
  },

  async deleteEvent(id: string, userId: string) {
    if (isDBConnected()) {
      return EventModel.findOneAndDelete({ _id: id, userId });
    }
    const event = memoryStore.events.get(id);
    if (event && event.userId === userId) {
      memoryStore.events.delete(id);
      return event;
    }
    return null;
  },

  // --- WORKSPACE ---
  async getWorkspace(userId: string) {
    if (isDBConnected()) {
      let ws = await WorkspaceModel.findOne({ userId });
      if (!ws) {
        ws = await WorkspaceModel.create({ userId });
      }
      return ws;
    }
    let ws = memoryStore.workspaces.get(userId);
    if (!ws) {
      ws = {
        _id: `ws_${userId}`,
        userId,
        wallpaper: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg',
        theme: 'dark',
        accentColor: 'cyan',
        blurIntensity: 'high',
        soundEnabled: true,
        dockPosition: 'bottom',
        dockConfiguration: ['ai', 'terminal', 'files', 'editor', 'browser', 'calendar', 'sysmon', 'music', 'arcade', 'notes', 'calc'],
        windowLayout: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.workspaces.set(userId, ws);
    }
    return ws;
  },

  async updateWorkspace(userId: string, updates: Partial<any>) {
    if (isDBConnected()) {
      return WorkspaceModel.findOneAndUpdate({ userId }, { ...updates, updatedAt: new Date() }, { new: true, upsert: true });
    }
    const current = await this.getWorkspace(userId);
    const updated = { ...current, ...updates, updatedAt: new Date() };
    memoryStore.workspaces.set(userId, updated);
    return updated;
  },

  // --- CONVERSATIONS ---
  async getConversations(userId: string) {
    if (isDBConnected()) {
      return ConversationModel.find({ userId }).sort({ updatedAt: -1 });
    }
    return Array.from(memoryStore.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getConversationById(id: string, userId: string) {
    if (isDBConnected()) {
      return ConversationModel.findOne({ _id: id, userId });
    }
    const convo = memoryStore.conversations.get(id);
    return convo && convo.userId === userId ? convo : null;
  },

  async createConversation(userId: string, title: string = 'New Conversation') {
    if (isDBConnected()) {
      return ConversationModel.create({ userId, title, messages: [] });
    }
    const id = `convo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const convo = {
      _id: id,
      id,
      userId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.conversations.set(id, convo);
    return convo;
  },

  async appendMessageToConversation(id: string, userId: string, message: { sender: 'ai' | 'user'; text: string; source?: string }) {
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...message,
      timestamp: Date.now(),
    };

    if (isDBConnected()) {
      return ConversationModel.findOneAndUpdate(
        { _id: id, userId },
        { $push: { messages: msg }, updatedAt: new Date() },
        { new: true }
      );
    }

    const convo = memoryStore.conversations.get(id);
    if (!convo || convo.userId !== userId) return null;
    convo.messages.push(msg);
    convo.updatedAt = new Date();
    memoryStore.conversations.set(id, convo);
    return convo;
  },

  async deleteConversation(id: string, userId: string) {
    if (isDBConnected()) {
      return ConversationModel.findOneAndDelete({ _id: id, userId });
    }
    const convo = memoryStore.conversations.get(id);
    if (convo && convo.userId === userId) {
      memoryStore.conversations.delete(id);
      return convo;
    }
    return null;
  },
};
