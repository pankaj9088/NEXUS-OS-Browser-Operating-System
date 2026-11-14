import React from 'react';
import { useOSStore } from '../../store/osStore';
import { AppWindow } from './AppWindow';

// Import all App views
import { TerminalApp } from '../apps/terminal/TerminalApp';
import { FilesApp } from '../apps/files/FilesApp';
import { EditorApp } from '../apps/editor/EditorApp';
import { BrowserApp } from '../apps/browser/BrowserApp';
import { SysMonApp } from '../apps/sysmon/SysMonApp';
import { MusicApp } from '../apps/music/MusicApp';
import { NotesApp } from '../apps/notes/NotesApp';
import { CalcApp } from '../apps/calc/CalcApp';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { ArcadeApp } from '../apps/arcade/ArcadeApp';
import { AssistantApp } from '../apps/ai/AssistantApp';
import { CalendarApp } from '../apps/calendar/CalendarApp';

export const WindowManager: React.FC = () => {
  const windows = useOSStore((s) => s.windows);

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case 'terminal':
        return <TerminalApp />;
      case 'files':
        return <FilesApp />;
      case 'editor':
        return <EditorApp />;
      case 'browser':
        return <BrowserApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'sysmon':
        return <SysMonApp />;
      case 'music':
        return <MusicApp />;
      case 'notes':
        return <NotesApp />;
      case 'calc':
        return <CalcApp />;
      case 'settings':
        return <SettingsApp />;
      case 'arcade':
        return <ArcadeApp />;
      case 'ai':
        return <AssistantApp />;
      default:
        return (
          <div className="p-4 text-xs text-slate-400">
            Application binary not found: {appId}
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {windows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <AppWindow windowState={win}>
            {renderAppContent(win.appId)}
          </AppWindow>
        </div>
      ))}
    </div>
  );
};
