import { create } from 'zustand';
import { AIConversation, AIMessage } from '../types/os';
import { api } from '../services/apiClient';

const INITIAL_CONVERSATIONS: AIConversation[] = [
  {
    id: 'c-welcome',
    title: 'Nexus System Capabilities',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'm-1',
        sender: 'ai',
        text: 'Greetings. I am Nexus Copilot. I am initialized in local simulation kernel mode with support for streaming responses, code generation, and system control.',
        timestamp: Date.now() - 3600000,
        source: 'local-simulation',
      },
    ],
  },
];

interface AIStoreState {
  conversations: AIConversation[];
  activeConvoId: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  clearConversation: (id: string) => void;
  setActiveConvoId: (id: string) => void;
  addMessage: (convoId: string, message: AIMessage) => void;
  updateMessageText: (convoId: string, messageId: string, text: string) => void;
  finalizeMessage: (convoId: string, messageId: string, fullText: string, source: AIMessage['source']) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useAIStore = create<AIStoreState>((set, get) => {
  let initial = INITIAL_CONVERSATIONS;
  try {
    const raw = localStorage.getItem('nexus_ai_convos');
    if (raw) initial = JSON.parse(raw);
  } catch {}

  const save = (convos: AIConversation[]) => {
    try {
      localStorage.setItem('nexus_ai_convos', JSON.stringify(convos));
    } catch {}
  };

  return {
    conversations: initial,
    activeConvoId: initial[0]?.id || 'c-welcome',
    isStreaming: false,
    isLoading: false,
    error: null,

    fetchConversations: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get<{ conversations: any[] }>('/api/ai/conversations');
        if (res && Array.isArray(res.conversations)) {
          // If server conversations are empty, keep local conversations
          if (res.conversations.length > 0) {
            // Load messages for the first conversation or active
            const convos: AIConversation[] = res.conversations.map((c) => ({
              id: c.id,
              title: c.title,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
              messages: c.lastMessage ? [c.lastMessage] : [],
            }));

            const targetId = get().activeConvoId || convos[0].id;
            set({ conversations: convos, activeConvoId: targetId, isLoading: false });
            save(convos);

            // Fetch full messages for the target conversation
            if (targetId) {
              get().loadConversation(targetId);
            }
          } else {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        set({ isLoading: false, error: err.message || null });
      }
    },

    loadConversation: async (id: string) => {
      try {
        const res = await api.get<{ conversation: any }>(`/api/ai/conversations/${id}`);
        if (res && res.conversation) {
          const c = res.conversation;
          set((state) => {
            const updated = state.conversations.map((item) =>
              item.id === id ? { ...item, ...c } : item
            );
            save(updated);
            return { conversations: updated };
          });
        }
      } catch (err) {
        console.warn('Could not load conversation details:', err);
      }
    },

    createConversation: async () => {
      let id = `c-${Date.now()}`;
      try {
        const res = await api.post<{ conversation: any }>('/api/ai/conversations', {
          title: 'New Conversation',
        });
        if (res && res.conversation) {
          id = res.conversation.id;
          const newConvo: AIConversation = {
            id: res.conversation.id,
            title: res.conversation.title,
            createdAt: res.conversation.createdAt,
            updatedAt: res.conversation.updatedAt,
            messages: res.conversation.messages || [],
          };
          const updated = [newConvo, ...get().conversations];
          set({ conversations: updated, activeConvoId: id });
          save(updated);
          return id;
        }
      } catch (err) {
        console.warn('Backend create conversation failed, fallback to local:', err);
      }

      const newConvo: AIConversation = {
        id,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: `m-init-${Date.now()}`,
            sender: 'ai',
            text: 'How can I assist you today? Ask about operating system architecture, code algorithms, or terminal usage.',
            timestamp: Date.now(),
            source: 'local-simulation',
          },
        ],
      };
      const updated = [newConvo, ...get().conversations];
      set({ conversations: updated, activeConvoId: id });
      save(updated);
      return id;
    },

    deleteConversation: async (id) => {
      const remaining = get().conversations.filter((c) => c.id !== id);
      const nextActive = get().activeConvoId === id ? remaining[0]?.id || '' : get().activeConvoId;
      set({ conversations: remaining, activeConvoId: nextActive });
      save(remaining);

      try {
        await api.delete(`/api/ai/conversations/${id}`);
      } catch (err) {
        console.warn('Backend delete conversation failed:', err);
      }
    },

    clearConversation: (id) => {
      const updated = get().conversations.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [
                {
                  id: `m-clr-${Date.now()}`,
                  sender: 'ai' as const,
                  text: 'Conversation cleared. How can I help you next?',
                  timestamp: Date.now(),
                  source: 'local-simulation' as const,
                },
              ],
            }
          : c
      );
      set({ conversations: updated });
      save(updated);
    },

    setActiveConvoId: (id) => {
      set({ activeConvoId: id });
      get().loadConversation(id);
    },

    addMessage: (convoId, message) => {
      const updated = get().conversations.map((c) => {
        if (c.id !== convoId) return c;
        const newTitle = c.title === 'New Conversation' && message.sender === 'user'
          ? message.text.slice(0, 28)
          : c.title;
        return {
          ...c,
          title: newTitle,
          messages: [...c.messages, message],
          updatedAt: Date.now(),
        };
      });
      set({ conversations: updated });
      save(updated);
    },

    updateMessageText: (convoId, messageId, text) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === convoId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === messageId ? { ...m, text } : m)),
              }
            : c
        ),
      }));
    },

    finalizeMessage: (convoId, messageId, fullText, source) => {
      const updated = get().conversations.map((c) =>
        c.id === convoId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, text: fullText, isStreaming: false, source } : m
              ),
            }
          : c
      );
      set({ conversations: updated, isStreaming: false });
      save(updated);
    },

    setStreaming: (isStreaming) => set({ isStreaming }),
  };
});
