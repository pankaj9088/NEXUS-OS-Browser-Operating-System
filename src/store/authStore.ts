import { create } from 'zustand';
import { api, ApiError } from '../services/apiClient';
import { useSettingsStore } from './settingsStore';
import { useNotesStore } from './notesStore';
import { useFileStore } from './fileStore';
import { useCalendarStore } from './calendarStore';
import { useAIStore } from './aiStore';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: number;
}

interface AuthStoreState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  checkAuth: () => Promise<AuthUser | null>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => {
  // Listen for unauthorized events to trigger state updates
  api.onUnauthorized(() => {
    if (get().isAuthenticated) {
      set({ user: null, isAuthenticated: false, authError: 'Session expired. Please sign in again.' });
    }
  });

  // Helper to trigger store synchronization for the authenticated user
  const syncUserStores = async () => {
    try {
      await Promise.allSettled([
        useSettingsStore.getState().fetchWorkspace(),
        useNotesStore.getState().fetchNotes(),
        useFileStore.getState().fetchFiles(),
        useCalendarStore.getState().fetchCalendarEvents(),
        useAIStore.getState().fetchConversations(),
      ]);
    } catch (e) {
      console.warn('Non-fatal background sync warning:', e);
    }
  };

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    authError: null,

    clearError: () => set({ authError: null }),

    checkAuth: async () => {
      set({ isLoading: true, authError: null });
      try {
        const data = await api.get<{ user: AuthUser; token?: string }>('/api/auth/me');
        if (data && data.user) {
          if (data.token) {
            api.setToken(data.token);
          }
          set({ user: data.user, isAuthenticated: true, isLoading: false, authError: null });
          useSettingsStore.getState().updateSettings({ username: data.user.displayName });
          syncUserStores();
          return data.user;
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      } catch (err: any) {
        // Not authenticated or session expired
        set({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    },

    login: async ({ email, password }) => {
      set({ isLoading: true, authError: null });
      try {
        const data = await api.post<{ user: AuthUser; token: string }>('/api/auth/login', {
          email,
          password,
        });

        if (data.token) {
          api.setToken(data.token);
        }

        set({ user: data.user, isAuthenticated: true, isLoading: false, authError: null });
        useSettingsStore.getState().updateSettings({
          username: data.user.displayName,
          isLocked: false,
        });

        await syncUserStores();
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : 'Login failed. Please check credentials.';
        set({ isLoading: false, authError: msg });
        throw err;
      }
    },

    register: async ({ email, password, displayName }) => {
      set({ isLoading: true, authError: null });
      try {
        const data = await api.post<{ user: AuthUser; token: string }>('/api/auth/register', {
          email,
          password,
          displayName,
        });

        if (data.token) {
          api.setToken(data.token);
        }

        set({ user: data.user, isAuthenticated: true, isLoading: false, authError: null });
        useSettingsStore.getState().updateSettings({
          username: data.user.displayName,
          isLocked: false,
        });

        await syncUserStores();
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : 'Registration failed.';
        set({ isLoading: false, authError: msg });
        throw err;
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Ignore logout errors
      } finally {
        api.setToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false, authError: null });
        useSettingsStore.getState().updateSettings({
          isLocked: true,
          username: 'Nexus Explorer',
        });
      }
    },

    continueAsGuest: async () => {
      try {
        const data = await api.post<{ user: AuthUser; token: string }>('/api/auth/guest');
        if (data.token) {
          api.setToken(data.token);
        }
        set({ user: data.user, isAuthenticated: true, authError: null });
        useSettingsStore.getState().updateSettings({
          username: data.user.displayName,
          isLocked: false,
        });
        await syncUserStores();
      } catch {
        const guestUser: AuthUser = {
          id: 'usr_guest',
          email: 'guest@nexusos.internal',
          displayName: 'Guest Operator',
          role: 'guest',
          createdAt: Date.now(),
        };
        set({ user: guestUser, isAuthenticated: false, authError: null });
        useSettingsStore.getState().updateSettings({
          username: 'Guest Operator',
          isLocked: false,
        });
      }
    },
  };
});
