import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Settings, 
  Lock, 
  Power, 
  User, 
  ChevronRight, 
  Sparkles,
  LayoutGrid,
  List,
  LogOut
} from 'lucide-react';
import { useOSStore, useAuthStore, APP_REGISTRY } from '../../store/osStore';
import { AppIcon } from '../common/AppIcon';
import { AppId } from '../../types/os';
import { ACCENT_THEMES } from '../../utils/theme';

export const StartMenu: React.FC = () => {
  const isStartMenuOpen = useOSStore((s) => s.isStartMenuOpen);
  const setStartMenuOpen = useOSStore((s) => s.setStartMenuOpen);
  const openApp = useOSStore((s) => s.openApp);
  const lockSystem = useOSStore((s) => s.lockSystem);
  const settings = useOSStore((s) => s.settings);
  const windows = useOSStore((s) => s.windows);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'pinned' | 'all'>('pinned');

  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const accentColor = settings.accentColor;
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.cyan;

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStartMenuOpen) {
        setStartMenuOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Check if not clicking the start button itself
        const target = e.target as HTMLElement;
        if (!target.closest('#nexus-start-button')) {
          setStartMenuOpen(false);
        }
      }
    };

    if (isStartMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleMouseDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isStartMenuOpen, setStartMenuOpen]);

  if (!isStartMenuOpen) return null;

  const allApps = Object.values(APP_REGISTRY);

  const filteredApps = allApps.filter(
    (app) =>
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedApps = allApps.filter((app) => app.pinnedToDock);

  const handleLaunchApp = (appId: AppId) => {
    openApp(appId);
    setStartMenuOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed bottom-14 left-4 md:left-1/2 md:-translate-x-1/2 w-96 max-w-[calc(100vw-32px)] h-[520px] rounded-2xl glass-dropdown border border-white/10 text-slate-200 select-none shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150"
    >
      {/* Top Search Field */}
      <div className="p-4 border-b border-white/10 bg-slate-950/40">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type here to search apps, files, settings..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Main Apps View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Toggle between Pinned & All Apps */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            {search ? 'Search Results' : viewMode === 'pinned' ? 'Pinned Applications' : 'All Applications'}
          </span>
          {!search && (
            <button
              onClick={() => setViewMode(viewMode === 'pinned' ? 'all' : 'pinned')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>{viewMode === 'pinned' ? 'All Apps' : 'Pinned'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Pinned Grid View */}
        {(viewMode === 'pinned' && !search) ? (
          <div className="grid grid-cols-4 gap-3">
            {pinnedApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleLaunchApp(app.id)}
                className="group flex flex-col items-center p-2 rounded-xl hover:bg-white/10 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 group-hover:scale-105 border border-white/5 flex items-center justify-center transition-all mb-1.5">
                  <AppIcon name={app.icon} className="w-5 h-5 text-cyan-300" />
                </div>
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white line-clamp-1 truncate w-full">
                  {app.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* List View for All Apps / Search */
          <div className="space-y-1">
            {filteredApps.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No matching applications found.
              </div>
            ) : (
              filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <AppIcon name={app.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {app.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {app.description}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {app.category}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom User Profile & Power Controls */}
      <div className="h-14 px-4 bg-slate-950/80 border-t border-white/10 flex items-center justify-between">
        {/* User Card */}
        <div
          onClick={() => {
            openApp('settings');
            setStartMenuOpen(false);
          }}
          className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
            {settings.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-200">{settings.username}</div>
            <div className="text-[10px] text-slate-500">Nexus Superuser</div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              openApp('settings');
              setStartMenuOpen(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={lockSystem}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Lock System"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              useAuthStore.getState().logout();
              setStartMenuOpen(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out / Switch User"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
