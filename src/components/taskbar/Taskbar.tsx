import React from 'react';
import { Search, Settings, Cpu, Layers } from 'lucide-react';
import { useOSStore, APP_REGISTRY } from '../../store/osStore';
import { AppIcon } from '../common/AppIcon';
import { SystemTray } from './SystemTray';
import { AppId } from '../../types/os';
import { ACCENT_THEMES } from '../../utils/theme';

export const Taskbar: React.FC = () => {
  const isStartMenuOpen = useOSStore((s) => s.isStartMenuOpen);
  const toggleStartMenu = useOSStore((s) => s.toggleStartMenu);
  const isSearchOpen = useOSStore((s) => s.isSearchOpen);
  const toggleSearch = useOSStore((s) => s.toggleSearch);
  const openApp = useOSStore((s) => s.openApp);
  const toggleMinimize = useOSStore((s) => s.toggleMinimize);
  const focusWindow = useOSStore((s) => s.focusWindow);

  const windows = useOSStore((s) => s.windows);
  const activeWindowId = useOSStore((s) => s.activeWindowId);
  const accentColor = useOSStore((s) => s.settings.accentColor);
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.cyan;

  // Pinned apps on dock
  const dockAppIds: AppId[] = [
    'ai',
    'terminal',
    'files',
    'editor',
    'browser',
    'sysmon',
    'music',
    'arcade',
    'notes',
    'calendar',
    'calc',
  ];

  // Also include any running app that might not be in dockAppIds
  const openAppIds = Array.from(new Set(windows.map((w) => w.appId)));
  const allDisplayAppIds = Array.from(new Set([...dockAppIds, ...openAppIds]));

  const handleAppClick = (appId: AppId) => {
    // Find all windows of this app
    const appWins = windows.filter((w) => w.appId === appId);
    if (appWins.length === 0) {
      openApp(appId);
    } else {
      // Toggle or focus the top instance
      const topInstance = appWins.find((w) => w.id === activeWindowId) || appWins[0];
      toggleMinimize(topInstance.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 z-[9000] flex items-center justify-between px-3 select-none">
      {/* Left / Center Zone: Start Button, Search, Dock Icons */}
      <div className="flex items-center gap-1.5 h-full">
        {/* Nexus OS Start Button */}
        <button
          id="nexus-start-button"
          onClick={toggleStartMenu}
          className={`h-9 px-2.5 rounded-xl flex items-center gap-2 transition-all ${
            isStartMenuOpen
              ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'hover:bg-white/10 text-slate-200'
          }`}
          title="Start Menu"
        >
          {/* Nexus Futuristic Hexagon Core Icon */}
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <span className="text-[10px] font-black text-slate-950">N</span>
          </div>
          <span className="text-xs font-bold tracking-wider hidden sm:inline">NEXUS</span>
        </button>

        {/* Quick Spotlight Search Button */}
        <button
          id="nexus-search-button"
          onClick={toggleSearch}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
            isSearchOpen
              ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'hover:bg-white/10 text-slate-400 hover:text-white'
          }`}
          title="Spotlight Search (Alt+Space)"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-1" />

        {/* Dock Applications */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {allDisplayAppIds.map((appId) => {
            const appDef = APP_REGISTRY[appId];
            if (!appDef) return null;

            const appWins = windows.filter((w) => w.appId === appId);
            const isRunning = appWins.length > 0;
            const isActive = appWins.some((w) => w.id === activeWindowId && !w.isMinimized);

            return (
              <button
                key={appId}
                onClick={() => handleAppClick(appId)}
                className={`group relative h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-white/15 shadow-sm text-cyan-300'
                    : isRunning
                    ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={appDef.title}
              >
                <AppIcon
                  name={appDef.icon}
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-300' : ''
                  }`}
                />

                {/* Running dot indicator */}
                {isRunning && (
                  <span
                    className={`absolute bottom-0.5 h-1 rounded-full transition-all ${
                      isActive
                        ? 'w-4 bg-cyan-400 shadow-sm shadow-cyan-400'
                        : 'w-1.5 bg-slate-400/70'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Zone: Settings & System Tray */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => openApp('settings')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <SystemTray />
      </div>
    </div>
  );
};
