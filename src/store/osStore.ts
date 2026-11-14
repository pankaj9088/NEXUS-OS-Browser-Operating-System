import { useWindowStore } from './windowStore';
import { useAppStore } from './appStore';
import { useSettingsStore } from './settingsStore';
import { useFileStore } from './fileStore';
import { useNotificationStore } from './notificationStore';
import { useCalendarStore } from './calendarStore';
import { useNotesStore } from './notesStore';
import { useAIStore } from './aiStore';
import { useAuthStore } from './authStore';

export * from './appStore';
export * from './settingsStore';
export * from './windowStore';
export * from './notificationStore';
export * from './fileStore';
export * from './notesStore';
export * from './calendarStore';
export * from './aiStore';
export * from './authStore';

// Type combining all modular store states
export type CombinedOSState = ReturnType<typeof useWindowStore.getState> &
  ReturnType<typeof useAppStore.getState> &
  ReturnType<typeof useSettingsStore.getState> &
  ReturnType<typeof useFileStore.getState> &
  ReturnType<typeof useNotificationStore.getState> &
  ReturnType<typeof useCalendarStore.getState> &
  ReturnType<typeof useNotesStore.getState> &
  ReturnType<typeof useAIStore.getState> &
  ReturnType<typeof useAuthStore.getState> & {
    isOnline: boolean;
    batteryLevel: number;
  };

// Backward-compatible strongly-typed unified facade hook
export function useOSStore<T>(selector: (state: CombinedOSState) => T): T {
  const windowState = useWindowStore();
  const appState = useAppStore();
  const settingsState = useSettingsStore();
  const fileState = useFileStore();
  const notifState = useNotificationStore();
  const calendarState = useCalendarStore();
  const notesState = useNotesStore();
  const aiState = useAIStore();
  const authState = useAuthStore();

  const combined: CombinedOSState = {
    ...windowState,
    ...appState,
    ...settingsState,
    ...fileState,
    ...notifState,
    ...calendarState,
    ...notesState,
    ...aiState,
    ...authState,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    batteryLevel: 98,
  };

  return selector(combined);
}
