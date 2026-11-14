import { create } from 'zustand';
import { WindowState, AppId, ContextMenuItem } from '../types/os';
import { APP_REGISTRY } from './appStore';
import { soundFX } from '../hooks/useSound';
import { useSettingsStore } from './settingsStore';

interface WindowStoreState {
  windows: WindowState[];
  activeWindowId: string | null;
  highestZIndex: number;

  isStartMenuOpen: boolean;
  isSearchOpen: boolean;
  isNotificationCenterOpen: boolean;
  isCalendarOpen: boolean;
  isControlCenterOpen: boolean;
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;

  openApp: (appId: AppId, initialTitle?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => void;

  toggleStartMenu: () => void;
  setStartMenuOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleNotificationCenter: () => void;
  toggleCalendar: () => void;
  toggleControlCenter: () => void;
  closeAllOverlays: () => void;

  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
}

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  highestZIndex: 100,

  isStartMenuOpen: false,
  isSearchOpen: false,
  isNotificationCenterOpen: false,
  isCalendarOpen: false,
  isControlCenterOpen: false,
  contextMenu: null,

  openApp: (appId: AppId, initialTitle?: string) => {
    const state = get();
    const appDef = APP_REGISTRY[appId];
    if (!appDef) return;

    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;

    // Check if singleton and already exists
    if (appDef.isSingleton) {
      const existing = state.windows.find((w) => w.appId === appId);
      if (existing) {
        soundFX.playWindowOpen(soundEnabled);
        const newZ = state.highestZIndex + 1;
        set({
          windows: state.windows.map((w) =>
            w.id === existing.id
              ? { ...w, isMinimized: false, zIndex: newZ }
              : w
          ),
          activeWindowId: existing.id,
          highestZIndex: newZ,
          isStartMenuOpen: false,
          isSearchOpen: false,
        });
        return;
      }
    }

    // Compute cascading position
    const offset = (state.windows.length % 8) * 32;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const width = Math.min(appDef.defaultWidth, viewportW - 80);
    const height = Math.min(appDef.defaultHeight, viewportH - 120);
    const x = Math.max(40, Math.min(viewportW - width - 40, 100 + offset));
    const y = Math.max(30, Math.min(viewportH - height - 80, 50 + offset));

    const newWindowId = `win-${appId}-${Date.now()}`;
    const newZ = state.highestZIndex + 1;

    const newWindow: WindowState = {
      id: newWindowId,
      appId,
      title: initialTitle || appDef.title,
      icon: appDef.icon,
      x,
      y,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
    };

    soundFX.playWindowOpen(soundEnabled);

    set({
      windows: [...state.windows, newWindow],
      activeWindowId: newWindowId,
      highestZIndex: newZ,
      isStartMenuOpen: false,
      isSearchOpen: false,
    });
  },

  closeWindow: (id: string) => {
    const state = get();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    soundFX.playWindowClose(soundEnabled);

    const remaining = state.windows.filter((w) => w.id !== id);
    const nextActive = remaining.length > 0
      ? remaining.reduce((prev, curr) => (curr.zIndex > prev.zIndex ? curr : prev)).id
      : null;

    set({
      windows: remaining,
      activeWindowId: nextActive,
    });
  },

  minimizeWindow: (id: string) => {
    const state = get();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    soundFX.playClick(soundEnabled);

    const target = state.windows.find((w) => w.id === id);
    if (!target) return;

    const remainingOpen = state.windows.filter((w) => w.id !== id && !w.isMinimized);
    const nextActive = remainingOpen.length > 0
      ? remainingOpen.reduce((prev, curr) => (curr.zIndex > prev.zIndex ? curr : prev)).id
      : null;

    set({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
      activeWindowId: state.activeWindowId === id ? nextActive : state.activeWindowId,
    });
  },

  maximizeWindow: (id: string) => {
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    soundFX.playClick(soundEnabled);

    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          return {
            ...w,
            isMaximized: false,
            x: w.previousBounds?.x ?? w.x,
            y: w.previousBounds?.y ?? w.y,
            width: w.previousBounds?.width ?? w.width,
            height: w.previousBounds?.height ?? w.height,
          };
        } else {
          return {
            ...w,
            isMaximized: true,
            previousBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
          };
        }
      }),
    }));
  },

  restoreWindow: (id: string) => {
    const state = get();
    const newZ = state.highestZIndex + 1;
    set({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: newZ } : w
      ),
      activeWindowId: id,
      highestZIndex: newZ,
    });
  },

  toggleMinimize: (id: string) => {
    const state = get();
    const win = state.windows.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      state.restoreWindow(id);
    } else if (state.activeWindowId === id) {
      state.minimizeWindow(id);
    } else {
      state.focusWindow(id);
    }
  },

  focusWindow: (id: string) => {
    const state = get();
    if (state.activeWindowId === id) return;
    const newZ = state.highestZIndex + 1;
    set({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: newZ } : w
      ),
      activeWindowId: id,
      highestZIndex: newZ,
    });
  },

  updateWindowBounds: (id: string, bounds) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, ...bounds } : w
      ),
    }));
  },

  toggleStartMenu: () => {
    const current = get().isStartMenuOpen;
    get().closeAllOverlays();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    if (!current) soundFX.playClick(soundEnabled);
    set({ isStartMenuOpen: !current });
  },

  setStartMenuOpen: (open: boolean) => set({ isStartMenuOpen: open }),

  toggleSearch: () => {
    const current = get().isSearchOpen;
    get().closeAllOverlays();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    if (!current) soundFX.playClick(soundEnabled);
    set({ isSearchOpen: !current });
  },

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  toggleNotificationCenter: () => {
    const current = get().isNotificationCenterOpen;
    get().closeAllOverlays();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    if (!current) soundFX.playClick(soundEnabled);
    set({ isNotificationCenterOpen: !current });
  },

  toggleCalendar: () => {
    const current = get().isCalendarOpen;
    get().closeAllOverlays();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    if (!current) soundFX.playClick(soundEnabled);
    set({ isCalendarOpen: !current });
  },

  toggleControlCenter: () => {
    const current = get().isControlCenterOpen;
    get().closeAllOverlays();
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    if (!current) soundFX.playClick(soundEnabled);
    set({ isControlCenterOpen: !current });
  },

  closeAllOverlays: () => {
    set({
      isStartMenuOpen: false,
      isSearchOpen: false,
      isNotificationCenterOpen: false,
      isCalendarOpen: false,
      isControlCenterOpen: false,
      contextMenu: null,
    });
  },

  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => {
    const soundEnabled = useSettingsStore.getState().settings.soundEnabled;
    soundFX.playClick(soundEnabled);
    set({ contextMenu: { x, y, items } });
  },

  hideContextMenu: () => set({ contextMenu: null }),
}));
