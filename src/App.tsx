import React, { useEffect } from 'react';
import { useOSStore } from './store/osStore';
import { Desktop } from './components/desktop/Desktop';
import { WindowManager } from './components/window/WindowManager';
import { Taskbar } from './components/taskbar/Taskbar';
import { StartMenu } from './components/taskbar/StartMenu';
import { SearchPanel } from './components/taskbar/SearchPanel';
import { CalendarFlyout } from './components/taskbar/CalendarFlyout';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { ToastContainer } from './components/notifications/ToastContainer';
import { ContextMenu } from './components/desktop/ContextMenu';
import { LockScreen } from './components/lockscreen/LockScreen';

export default function App() {
  const openApp = useOSStore((s) => s.openApp);
  const toggleSearch = useOSStore((s) => s.toggleSearch);
  const closeAllOverlays = useOSStore((s) => s.closeAllOverlays);
  const windows = useOSStore((s) => s.windows);
  const checkAuth = useOSStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt + Space or Ctrl + K for Spotlight Search
      if ((e.altKey && e.code === 'Space') || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        toggleSearch();
      }
      // Alt + T for Terminal
      else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openApp('terminal');
      }
      // Escape closes overlays
      else if (e.key === 'Escape') {
        closeAllOverlays();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleSearch, openApp, closeAllOverlays]);

  // Open welcoming window on first mount if no windows open
  useEffect(() => {
    if (windows.length === 0) {
      // Open Copilot and Terminal
      openApp('ai');
    }
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* Desktop Canvas & Icons */}
      <Desktop />

      {/* Multi-Window Manager */}
      <WindowManager />

      {/* Bottom Taskbar & Dock */}
      <Taskbar />

      {/* Popups & Overlays */}
      <StartMenu />
      <SearchPanel />
      <CalendarFlyout />
      <NotificationCenter />
      <ContextMenu />
      <ToastContainer />

      {/* Lock Screen */}
      <LockScreen />
    </main>
  );
}
