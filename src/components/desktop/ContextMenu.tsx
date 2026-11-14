import React, { useEffect, useRef } from 'react';
import { useOSStore } from '../../store/osStore';
import { 
  FolderPlus, 
  FileText, 
  RotateCw, 
  Palette, 
  Maximize, 
  Activity, 
  Terminal,
  Settings
} from 'lucide-react';

export const ContextMenu: React.FC = () => {
  const contextMenu = useOSStore((s) => s.contextMenu);
  const hideContextMenu = useOSStore((s) => s.hideContextMenu);
  const openApp = useOSStore((s) => s.openApp);
  const createFile = useOSStore((s) => s.createFile);
  const createFolder = useOSStore((s) => s.createFolder);
  const addNotification = useOSStore((s) => s.addNotification);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [hideContextMenu]);

  if (!contextMenu) return null;

  // Clamp coordinates within screen
  const menuW = 200;
  const menuH = 260;
  const clampedX = Math.min(contextMenu.x, window.innerWidth - menuW - 10);
  const clampedY = Math.min(contextMenu.y, window.innerHeight - menuH - 10);

  const handleCreateNote = () => {
    createFile('desktop', `Note_${Date.now().toString().slice(-4)}.txt`, 'New notes scratchpad');
    addNotification({
      title: 'Note Created',
      message: 'New text document added to desktop.',
      type: 'success',
      app: 'Desktop',
    });
    hideContextMenu();
  };

  const handleCreateFolder = () => {
    createFolder('desktop', `Folder_${Date.now().toString().slice(-4)}`);
    addNotification({
      title: 'Folder Created',
      message: 'New directory added to desktop.',
      type: 'success',
      app: 'Desktop',
    });
    hideContextMenu();
  };

  const handleRefresh = () => {
    addNotification({
      title: 'Compositor Refreshed',
      message: 'Desktop surface and display layers re-synchronized.',
      type: 'info',
      app: 'Compositor',
    });
    hideContextMenu();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    hideContextMenu();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-[9999] w-48 rounded-xl p-1.5 glass-dropdown text-xs text-slate-200 select-none shadow-2xl animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={handleCreateNote}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <FileText className="w-3.5 h-3.5 text-cyan-400" />
        <span>New Text Note</span>
      </button>

      <button
        onClick={handleCreateFolder}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
        <span>New Folder</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          openApp('terminal');
          hideContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <Terminal className="w-3.5 h-3.5 text-purple-400" />
        <span>Open Terminal Here</span>
      </button>

      <button
        onClick={() => {
          openApp('sysmon');
          hideContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <Activity className="w-3.5 h-3.5 text-amber-400" />
        <span>Activity Monitor</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        onClick={() => {
          openApp('settings');
          hideContextMenu();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        <span>Change Wallpaper...</span>
      </button>

      <button
        onClick={handleToggleFullscreen}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <Maximize className="w-3.5 h-3.5 text-slate-400" />
        <span>Toggle Fullscreen</span>
      </button>

      <button
        onClick={handleRefresh}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
      >
        <RotateCw className="w-3.5 h-3.5 text-slate-400" />
        <span>Refresh Desktop</span>
      </button>
    </div>
  );
};
