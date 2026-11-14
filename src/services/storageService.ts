import { FileSystemNode, CalendarEvent, SystemSettings, AIConversation } from '../types/os';

export interface IStorageService {
  loadFileSystem(): Promise<FileSystemNode[] | null>;
  saveFileSystem(nodes: FileSystemNode[]): Promise<void>;
  
  loadCalendarEvents(): Promise<CalendarEvent[] | null>;
  saveCalendarEvents(events: CalendarEvent[]): Promise<void>;
  
  loadConversations(): Promise<AIConversation[] | null>;
  saveConversations(convos: AIConversation[]): Promise<void>;

  loadSettings(): Promise<Partial<SystemSettings> | null>;
  saveSettings(settings: SystemSettings): Promise<void>;
}

class LocalStorageAdapter implements IStorageService {
  private prefix = 'nexus_os_';

  async loadFileSystem(): Promise<FileSystemNode[] | null> {
    try {
      const data = localStorage.getItem(`${this.prefix}fs`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async saveFileSystem(nodes: FileSystemNode[]): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}fs`, JSON.stringify(nodes));
    } catch (e) {
      console.warn('Storage quota exceeded for virtual filesystem:', e);
    }
  }

  async loadCalendarEvents(): Promise<CalendarEvent[] | null> {
    try {
      const data = localStorage.getItem(`${this.prefix}calendar`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}calendar`, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save calendar events:', e);
    }
  }

  async loadConversations(): Promise<AIConversation[] | null> {
    try {
      const data = localStorage.getItem(`${this.prefix}ai_convos`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async saveConversations(convos: AIConversation[]): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}ai_convos`, JSON.stringify(convos));
    } catch (e) {
      console.warn('Failed to save conversations:', e);
    }
  }

  async loadSettings(): Promise<Partial<SystemSettings> | null> {
    try {
      const data = localStorage.getItem(`${this.prefix}settings`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async saveSettings(settings: SystemSettings): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }
}

export const storageService: IStorageService = new LocalStorageAdapter();
