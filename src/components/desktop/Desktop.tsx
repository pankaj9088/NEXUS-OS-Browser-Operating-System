import React, { useState } from 'react';
import { useOSStore, APP_REGISTRY } from '../../store/osStore';
import { DesktopIcon } from './DesktopIcon';
import { AppId } from '../../types/os';

export const Desktop: React.FC = () => {
  const wallpaper = useOSStore((s) => s.settings.wallpaper);
  const openApp = useOSStore((s) => s.openApp);
  const showContextMenu = useOSStore((s) => s.showContextMenu);
  const closeAllOverlays = useOSStore((s) => s.closeAllOverlays);
  const fileSystem = useOSStore((s) => s.fileSystem);
  const setActiveEditorFileId = useOSStore((s) => s.setActiveEditorFileId);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Desktop shortcuts
  const defaultShortcuts: { id: AppId; title: string; icon: string }[] = [
    { id: 'ai', title: 'Nexus Copilot', icon: 'Bot' },
    { id: 'terminal', title: 'Terminal', icon: 'Terminal' },
    { id: 'files', title: 'Files', icon: 'Folder' },
    { id: 'editor', title: 'Nexus Code', icon: 'Code2' },
    { id: 'browser', title: 'Nexus Surf', icon: 'Globe' },
    { id: 'sysmon', title: 'Activity Mon', icon: 'Activity' },
    { id: 'music', title: 'Audio Lounge', icon: 'Music' },
    { id: 'arcade', title: 'Neon Breakout', icon: 'Gamepad2' },
    { id: 'notes', title: 'Notes', icon: 'StickyNote' },
    { id: 'calc', title: 'Calculator', icon: 'Calculator' },
    { id: 'settings', title: 'Settings', icon: 'Settings' },
  ];

  // Files located on the desktop folder
  const desktopFiles = fileSystem.filter((f) => f.parentId === 'desktop');

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, []);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    // Only deselect if clicked the desktop canvas itself
    if (e.target === e.currentTarget) {
      setSelectedItemId(null);
      closeAllOverlays();
    }
  };

  const isGradientWallpaper = wallpaper.startsWith('linear');

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      className="absolute inset-0 overflow-hidden select-none"
      style={{
        backgroundImage: isGradientWallpaper ? wallpaper : `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle sci-fi ambient vignette / dark mesh scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />

      {/* Desktop Icons Container - Top-to-bottom grid on left column */}
      <div 
        onClick={handleDesktopClick}
        className="absolute inset-0 p-4 pb-16 flex flex-col flex-wrap items-start content-start gap-2 z-10 overflow-hidden"
      >
        {/* Core App Shortcuts */}
        {defaultShortcuts.map((sc) => (
          <DesktopIcon
            key={sc.id}
            id={sc.id}
            title={sc.title}
            icon={sc.icon}
            isSelected={selectedItemId === sc.id}
            onSelect={() => setSelectedItemId(sc.id)}
            onOpen={() => openApp(sc.id)}
          />
        ))}

        {/* Dynamic Desktop Files & Folders */}
        {desktopFiles.map((item) => (
          <DesktopIcon
            key={item.id}
            id={item.id}
            title={item.name}
            icon={item.type === 'folder' ? 'Folder' : item.fileType === 'code' ? 'Code2' : 'FileText'}
            isSelected={selectedItemId === item.id}
            onSelect={() => setSelectedItemId(item.id)}
            onOpen={() => {
              if (item.type === 'folder') {
                openApp('files');
              } else {
                setActiveEditorFileId(item.id);
                openApp('editor', `Nexus Code - ${item.name}`);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
