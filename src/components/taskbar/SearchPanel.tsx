import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Globe, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useOSStore, APP_REGISTRY } from '../../store/osStore';
import { AppIcon } from '../common/AppIcon';
import { AppId } from '../../types/os';

export const SearchPanel: React.FC = () => {
  const isSearchOpen = useOSStore((s) => s.isSearchOpen);
  const setSearchOpen = useOSStore((s) => s.setSearchOpen);
  const openApp = useOSStore((s) => s.openApp);
  const fileSystem = useOSStore((s) => s.fileSystem);
  const setActiveEditorFileId = useOSStore((s) => s.setActiveEditorFileId);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('#nexus-search-button')) {
          setSearchOpen(false);
        }
      }
    };

    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleMouseDown);
      setTimeout(() => inputRef.current?.focus(), 50);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  // Filter apps
  const matchedApps = Object.values(APP_REGISTRY).filter((app) =>
    app.title.toLowerCase().includes(query.toLowerCase()) ||
    app.description.toLowerCase().includes(query.toLowerCase())
  );

  // Filter files
  const matchedFiles = fileSystem.filter(
    (f) =>
      f.type === 'file' &&
      (f.name.toLowerCase().includes(query.toLowerCase()) ||
        (f.content && f.content.toLowerCase().includes(query.toLowerCase())))
  );

  interface ResultItem {
    id: string;
    type: 'app' | 'file';
    title: string;
    subtitle: string;
    icon: string;
    action: () => void;
  }

  const results: ResultItem[] = [
    ...matchedApps.map((app) => ({
      id: `app-${app.id}`,
      type: 'app' as const,
      title: app.title,
      subtitle: app.description,
      icon: app.icon,
      action: () => {
        openApp(app.id);
        setSearchOpen(false);
      },
    })),
    ...matchedFiles.map((f) => ({
      id: `file-${f.id}`,
      type: 'file' as const,
      title: f.name,
      subtitle: `File in virtual filesystem (${f.size || 0} bytes)`,
      icon: 'FileText',
      action: () => {
        setActiveEditorFileId(f.id);
        openApp('editor', `Nexus Code - ${f.name}`);
        setSearchOpen(false);
      },
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg rounded-2xl glass-dropdown border border-white/10 text-slate-200 select-none shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Search Input Bar */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-950/60">
        <Search className="w-5 h-5 text-cyan-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Spotlight search apps, files, commands..."
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none font-sans"
        />
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-mono">
          ESC
        </kbd>
      </div>

      {/* Results List */}
      <div className="max-h-80 overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No results found for "{query}"
          </div>
        ) : (
          results.map((res, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={res.id}
                onClick={res.action}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-cyan-500/20 text-white' : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                  <AppIcon name={res.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {res.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate leading-tight">
                    {res.subtitle}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono shrink-0">
                    <span>Open</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Hint Bar */}
      <div className="h-8 px-4 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Nexus Spotlight Engine</span>
        <span>↑↓ to navigate · ↵ to select</span>
      </div>
    </div>
  );
};
