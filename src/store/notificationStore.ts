import { create } from 'zustand';
import { NotificationItem } from '../types/os';
import { soundFX } from '../hooks/useSound';
import { useSettingsStore } from './settingsStore';

interface NotificationStoreState {
  notifications: NotificationItem[];
  toasts: NotificationItem[];
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  dismissToast: (id: string) => void;
  clearNotifications: () => void;
  markNotificationsRead: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [
    {
      id: 'notif-1',
      title: 'Nexus OS Initialized',
      message: 'Modular state stores, virtual filesystem, and graphics compositor are ready.',
      timestamp: Date.now() - 1000 * 60 * 3,
      type: 'system',
      app: 'System',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Copilot Online',
      message: 'AI Assistant ready with streaming, code syntax blocks, and conversation history.',
      timestamp: Date.now() - 1000 * 60,
      type: 'info',
      app: 'Copilot',
      read: false,
    },
  ],
  toasts: [],

  addNotification: (notif) => {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    soundFX.playNotification(soundEnabled);
    set((state) => ({
      notifications: [item, ...state.notifications],
      toasts: [...state.toasts, item],
    }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  markNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
