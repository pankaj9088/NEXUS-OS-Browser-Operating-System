import { create } from 'zustand';
import { SystemSettings, AccentColor, ThemeMode } from '../types/os';
import { soundFX } from '../hooks/useSound';
import { api } from '../services/apiClient';

export const WALLPAPERS = [
  {
    id: 'nebula',
    name: 'Cosmic Rings',
    url: '/src/assets/images/nexus_nebula_wallpaper_1792165936066.jpg',
    description: 'Deep obsidian cosmic void with electric blue & violet orbital rings',
  },
  {
    id: 'cyber',
    name: 'Neo Metropolis',
    url: '/src/assets/images/cyber_skyline_wallpaper_1792165938487.jpg',
    description: 'Futuristic midnight skyline with subtle luminescent architecture',
  },
  {
    id: 'mesh',
    name: 'Quantum Ribbon',
    url: '/src/assets/images/abstract_geometric_wallpaper_1792165937034.jpg',
    description: 'Minimalist 3D fluid ribbon mesh with cyan & lavender refraction',
  },
  {
    id: 'pure-dark',
    name: 'Obsidian Void',
    url: 'linear-gradient(135deg, #05070f 0%, #0a0f1d 50%, #030408 100%)',
    description: 'Pure distraction-free minimal gradient surface',
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  wallpaper: WALLPAPERS[0].url,
  customWallpapers: [],
  themeMode: 'dark',
  accentColor: 'cyan',
  soundEnabled: true,
  blurIntensity: 'high',
  animationsEnabled: true,
  clockFormat: '12h',
  showSeconds: true,
  dockPosition: 'bottom',
  isLocked: false,
  username: 'Nexus Explorer',
};

interface SettingsStoreState {
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  fetchWorkspace: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  setWallpaper: (url: string) => void;
  uploadCustomWallpaper: (dataUrl: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleSound: () => void;
  lockSystem: () => void;
  unlockSystem: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  let initial = DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem('nexus_os_settings');
    if (raw) initial = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}

  return {
    settings: initial,
    isLoading: false,
    error: null,

    fetchWorkspace: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.get<{ workspace: any }>('/api/workspace');
        if (data && data.workspace) {
          const ws = data.workspace;
          set((state) => {
            const merged: SystemSettings = {
              ...state.settings,
              wallpaper: ws.wallpaper || state.settings.wallpaper,
              themeMode: ws.theme === 'light' ? 'light' : 'dark',
              accentColor: ws.accentColor || state.settings.accentColor,
              soundEnabled: ws.soundEnabled !== undefined ? ws.soundEnabled : state.settings.soundEnabled,
              blurIntensity: ws.blurIntensity || state.settings.blurIntensity,
              dockPosition: ws.dockPosition || state.settings.dockPosition,
            };
            try {
              localStorage.setItem('nexus_os_settings', JSON.stringify(merged));
            } catch {}
            return { settings: merged, isLoading: false };
          });
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        // If not authenticated or backend unavailable, preserve current local state
        set({ isLoading: false, error: err.message || null });
      }
    },

    updateSettings: (newSettings) => {
      set((state) => {
        const merged = { ...state.settings, ...newSettings };
        try {
          localStorage.setItem('nexus_os_settings', JSON.stringify(merged));
        } catch {}

        // Sync to backend /api/workspace if relevant fields changed
        const patchPayload: Record<string, any> = {};
        if (newSettings.wallpaper !== undefined) patchPayload.wallpaper = newSettings.wallpaper;
        if (newSettings.themeMode !== undefined) patchPayload.theme = newSettings.themeMode;
        if (newSettings.accentColor !== undefined) patchPayload.accentColor = newSettings.accentColor;
        if (newSettings.blurIntensity !== undefined) patchPayload.blurIntensity = newSettings.blurIntensity;
        if (newSettings.soundEnabled !== undefined) patchPayload.soundEnabled = newSettings.soundEnabled;
        if (newSettings.dockPosition !== undefined) patchPayload.dockPosition = newSettings.dockPosition;

        if (Object.keys(patchPayload).length > 0) {
          api.patch('/api/workspace', patchPayload).catch((e) => {
            // Backend update failed, silently keep local or log for debugging
            console.debug('Workspace backend patch skipped/failed:', e);
          });
        }

        return { settings: merged };
      });
    },

    setWallpaper: (url) => {
      get().updateSettings({ wallpaper: url });
    },

    uploadCustomWallpaper: (dataUrl) => {
      const current = get().settings.customWallpapers || [];
      const updated = [dataUrl, ...current.slice(0, 5)];
      get().updateSettings({ wallpaper: dataUrl, customWallpapers: updated });
    },

    setThemeMode: (mode) => {
      get().updateSettings({ themeMode: mode });
    },

    setAccentColor: (color) => {
      get().updateSettings({ accentColor: color });
    },

    toggleSound: () => {
      const next = !get().settings.soundEnabled;
      get().updateSettings({ soundEnabled: next });
    },

    lockSystem: () => {
      soundFX.playClick(get().settings.soundEnabled);
      get().updateSettings({ isLocked: true });
    },

    unlockSystem: () => {
      soundFX.playClick(get().settings.soundEnabled);
      get().updateSettings({ isLocked: false });
    },
  };
});
