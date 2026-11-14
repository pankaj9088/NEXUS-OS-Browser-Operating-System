import { create } from 'zustand';
import { api, ApiError } from '../services/apiClient';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
}

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'n-1',
    title: 'Operating System Specifications',
    content: `# Nexus OS Architecture Overview\n\n1. Hypervisor: WASM sandbox with strict process isolation.\n2. Audio: Web Audio API procedural synthesis for tactical UI clicks & music.\n3. Virtual Filesystem: Decoupled storage abstraction supporting both pre-loaded samples and user uploads.\n4. AI Copilot: Streaming generative assistant with syntax-highlighted code blocks.`,
    createdAt: '2026-10-15 09:30',
    updatedAt: '2026-10-16 08:45',
    category: 'System',
  },
  {
    id: 'n-2',
    title: 'Keyboard Shortcuts Reference',
    content: `- Alt + Space / Ctrl + K: Spotlight Search\n- Alt + T: Launch Terminal\n- Escape: Close open start menu, search, or active flyouts\n- Double-click window titlebar: Toggle Maximize/Restore`,
    createdAt: '2026-10-15 14:10',
    updatedAt: '2026-10-16 09:00',
    category: 'Productivity',
  },
  {
    id: 'n-3',
    title: 'Upcoming Milestones',
    content: `- Cloud persistence sync\n- Real-time collaborative canvas\n- Peer-to-peer file transfer engine\n- Extended hardware acceleration`,
    createdAt: '2026-10-16 07:15',
    updatedAt: '2026-10-16 07:15',
    category: 'Roadmap',
  },
];

interface NotesStoreState {
  notes: NoteItem[];
  activeNoteId: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  createNote: () => Promise<string>;
  updateNote: (id: string, updates: Partial<Pick<NoteItem, 'title' | 'content' | 'category'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNoteId: (id: string) => void;
}

export const useNotesStore = create<NotesStoreState>((set, get) => {
  let initial = DEFAULT_NOTES;
  try {
    const raw = localStorage.getItem('nexus_notes');
    if (raw) initial = JSON.parse(raw);
  } catch {}

  const save = (notes: NoteItem[]) => {
    try {
      localStorage.setItem('nexus_notes', JSON.stringify(notes));
    } catch {}
  };

  return {
    notes: initial,
    activeNoteId: initial[0]?.id || '',
    isLoading: false,
    isSaving: false,
    error: null,

    fetchNotes: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get<{ notes: any[] }>('/api/notes');
        if (res && Array.isArray(res.notes)) {
          const mapped: NoteItem[] = res.notes.map((n) => ({
            id: n.id,
            title: n.title || 'Untitled',
            content: n.content || '',
            category: n.color || 'General',
            createdAt: typeof n.createdAt === 'number'
              ? new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
              : String(n.createdAt),
            updatedAt: typeof n.updatedAt === 'number'
              ? new Date(n.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
              : String(n.updatedAt),
          }));

          const activeId = mapped[0]?.id || '';
          set({ notes: mapped, activeNoteId: activeId, isLoading: false });
          save(mapped);
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        // Fallback to local storage
        set({ isLoading: false, error: err.message || null });
      }
    },

    createNote: async () => {
      set({ isSaving: true, error: null });
      try {
        const res = await api.post<{ note: any }>('/api/notes', {
          title: 'Untitled Note',
          content: '',
          color: 'General',
        });
        const n = res.note;
        const now = new Date(n.createdAt || Date.now()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const newNote: NoteItem = {
          id: n.id,
          title: n.title,
          content: n.content || '',
          category: n.color || 'General',
          createdAt: now,
          updatedAt: now,
        };
        const updated = [newNote, ...get().notes];
        set({ notes: updated, activeNoteId: n.id, isSaving: false });
        save(updated);
        return n.id;
      } catch (err: any) {
        // Fallback to local note if server call fails
        const now = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const id = `n-${Date.now()}`;
        const newNote: NoteItem = {
          id,
          title: 'Untitled Note',
          content: '',
          createdAt: now,
          updatedAt: now,
          category: 'General',
        };
        const updated = [newNote, ...get().notes];
        set({ notes: updated, activeNoteId: id, isSaving: false });
        save(updated);
        return id;
      }
    },

    updateNote: async (id, updates) => {
      const now = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const updated = get().notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: now } : n
      );
      set({ notes: updated, isSaving: true });
      save(updated);

      try {
        await api.patch(`/api/notes/${id}`, {
          title: updates.title,
          content: updates.content,
          color: updates.category,
        });
        set({ isSaving: false });
      } catch (err: any) {
        set({ isSaving: false, error: err.message || null });
      }
    },

    deleteNote: async (id) => {
      const remaining = get().notes.filter((n) => n.id !== id);
      const nextActive = get().activeNoteId === id ? remaining[0]?.id || '' : get().activeNoteId;
      set({ notes: remaining, activeNoteId: nextActive });
      save(remaining);

      try {
        await api.delete(`/api/notes/${id}`);
      } catch (err: any) {
        console.warn('Backend delete note note skipped/failed:', err);
      }
    },

    setActiveNoteId: (id) => set({ activeNoteId: id }),
  };
});
