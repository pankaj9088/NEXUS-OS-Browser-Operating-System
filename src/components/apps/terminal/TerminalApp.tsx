import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { useOSStore, WALLPAPERS } from '../../../store/osStore';
import { AccentColor, AppId } from '../../../types/os';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

export const TerminalApp: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: `NEXUS OS Hypervisor Terminal [v4.2.0-release]
Type "help" for a list of built-in commands or "clear" to reset.
Safe sandboxed interpreter active.`,
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileSystem = useOSStore((s) => s.fileSystem);
  const createFile = useOSStore((s) => s.createFile);
  const createFolder = useOSStore((s) => s.createFolder);
  const deleteFSNode = useOSStore((s) => s.deleteFSNode);
  const setWallpaper = useOSStore((s) => s.setWallpaper);
  const setAccentColor = useOSStore((s) => s.setAccentColor);
  const setThemeMode = useOSStore((s) => s.setThemeMode);
  const openApp = useOSStore((s) => s.openApp);
  const addNotification = useOSStore((s) => s.addNotification);
  const settings = useOSStore((s) => s.settings);

  // Current working directory in virtual FS
  const [currentFolderId, setCurrentFolderId] = useState<string>('desktop');

  const currentFolder = fileSystem.find((n) => n.id === currentFolderId) || { id: 'desktop', name: 'desktop', parentId: null as string | null };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleClear = () => {
    setLines([]);
  };

  const handleCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const inputLine: TerminalLine = {
      id: `in-${Date.now()}`,
      type: 'input',
      text: `${settings.username.toLowerCase()}@nexus:~/${currentFolder.name}$ ${trimmed}`,
    };

    const parts = trimmed.split(' ').filter(Boolean);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const outputLines: TerminalLine[] = [];

    switch (cmd) {
      case 'help':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `Nexus OS Command Interpreter Reference:
  help                    List available commands
  clear                   Clear terminal screen
  date                    Show current system calendar date
  time                    Show current local time
  pwd                     Print working directory
  whoami                  Print active logged-in user profile
  ls                      List files & folders in current directory
  cd <dir>                Navigate to sub-directory or '..'
  cat <filename>          Display text content of a file
  touch <filename> [txt]  Create a new virtual text file
  mkdir <foldername>      Create a new virtual directory
  rm <name>               Delete file or folder
  echo <text>             Print text to output
  theme <dark|light>      Switch OS theme mode
  accent <color>          Change accent lighting: cyan, violet, emerald, amber, rose
  open <app>              Launch an application:
                          - notes, files, calculator, ai, terminal,
                          - calendar, browser, sysmon, music, arcade, settings
  sysinfo                 Display system specifications and runtime state`,
        });
        break;

      case 'clear':
        setLines([]);
        setInput('');
        return;

      case 'date':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        });
        break;

      case 'time':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        break;

      case 'pwd':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `/nexus/filesystem/${currentFolder.name}`,
        });
        break;

      case 'whoami':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'success',
          text: `${settings.username} (Security Group: superuser, Role: Administrator)`,
        });
        break;

      case 'sysinfo':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `  _  _ _____  __ _   _ ____
 | \\| | ____| \\/ / | | / ___|   OS: Nexus OS v4.2.0 (Browser Enclave)
 | .\` |  _|  \\  /| | | \\___ \\   Architecture: x86_64_wasm
 | |\\ | |___ /  \\| |_| |___) |  Kernel: WebEngine Hypervisor 2026.1
 |_| \\_|_____/_/\\_\\\\___/|____/   Theme: ${settings.themeMode.toUpperCase()} (${settings.accentColor})
                                Storage: Virtual File System (${fileSystem.length} nodes)
                                AI Engine: Gemini Multimodal & Local Kernel`,
        });
        break;

      case 'theme': {
        const mode = args[0]?.toLowerCase();
        if (mode === 'dark' || mode === 'light') {
          setThemeMode(mode);
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'success',
            text: `System theme mode set to: ${mode}`,
          });
        } else {
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'error',
            text: `Invalid theme parameter: "${args.join(' ')}". Use: theme dark OR theme light`,
          });
        }
        break;
      }

      case 'accent': {
        const color = args[0]?.toLowerCase() as AccentColor;
        if (['cyan', 'violet', 'emerald', 'amber', 'rose'].includes(color)) {
          setAccentColor(color);
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'success',
            text: `System accent light set to: ${color}`,
          });
        } else {
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'error',
            text: `Usage: accent <cyan|violet|emerald|amber|rose>`,
          });
        }
        break;
      }

      case 'open': {
        const target = args[0]?.toLowerCase();
        const mapToAppId: Record<string, AppId> = {
          notes: 'notes',
          note: 'notes',
          files: 'files',
          file: 'files',
          explorer: 'files',
          calculator: 'calc',
          calc: 'calc',
          ai: 'ai',
          copilot: 'ai',
          assistant: 'ai',
          terminal: 'terminal',
          calendar: 'calendar',
          cal: 'calendar',
          browser: 'browser',
          surf: 'browser',
          sysmon: 'sysmon',
          system: 'sysmon',
          monitor: 'sysmon',
          music: 'music',
          audio: 'music',
          arcade: 'arcade',
          game: 'arcade',
          breakout: 'arcade',
          settings: 'settings',
          editor: 'editor',
          code: 'editor',
        };

        if (target && mapToAppId[target]) {
          const appId = mapToAppId[target];
          openApp(appId);
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'success',
            text: `Launching ${appId}...`,
          });
        } else {
          outputLines.push({
            id: `out-${Date.now()}`,
            type: 'error',
            text: `Cannot open "${target || ''}". Available apps: notes, files, calculator, ai, calendar, browser, sysmon, music, arcade, settings.`,
          });
        }
        break;
      }

      case 'ls': {
        const items = fileSystem.filter((n) => n.parentId === currentFolderId);
        if (items.length === 0) {
          outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: '(empty directory)' });
        } else {
          const formatted = items
            .map((i) => (i.type === 'folder' ? `📁 ${i.name}/` : `📄 ${i.name} [${i.size || 0}B]`))
            .join('    ');
          outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: formatted });
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~') {
          setCurrentFolderId('desktop');
          outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: 'Navigated to ~/desktop' });
        } else if (target === '..') {
          const parent = fileSystem.find((n) => n.id === currentFolder.parentId);
          if (parent) {
            setCurrentFolderId(parent.id);
            outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: `Navigated to ~/${parent.name}` });
          } else {
            outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: 'Already at root filesystem node.' });
          }
        } else {
          const found = fileSystem.find(
            (n) => n.parentId === currentFolderId && n.type === 'folder' && n.name.toLowerCase() === target.toLowerCase()
          );
          if (found) {
            setCurrentFolderId(found.id);
            outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: `Navigated to ~/${found.name}` });
          } else {
            outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: `cd: no such directory: ${target}` });
          }
        }
        break;
      }

      case 'cat': {
        const filename = args[0];
        if (!filename) {
          outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: 'Usage: cat <filename>' });
        } else {
          const file = fileSystem.find(
            (n) => n.parentId === currentFolderId && n.type === 'file' && n.name.toLowerCase() === filename.toLowerCase()
          );
          if (file) {
            outputLines.push({ id: `out-${Date.now()}`, type: 'output', text: file.content || '(empty file)' });
          } else {
            outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: `cat: ${filename}: No such file` });
          }
        }
        break;
      }

      case 'touch': {
        const filename = args[0];
        if (!filename) {
          outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: 'Usage: touch <filename> [content]' });
        } else {
          const content = args.slice(1).join(' ') || '';
          createFile(currentFolderId, filename, content);
          outputLines.push({ id: `out-${Date.now()}`, type: 'success', text: `Created virtual file: ${filename}` });
        }
        break;
      }

      case 'mkdir': {
        const dirname = args[0];
        if (!dirname) {
          outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: 'Usage: mkdir <foldername>' });
        } else {
          createFolder(currentFolderId, dirname);
          outputLines.push({ id: `out-${Date.now()}`, type: 'success', text: `Created directory: ${dirname}` });
        }
        break;
      }

      case 'rm': {
        const target = args[0];
        if (!target) {
          outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: 'Usage: rm <name>' });
        } else {
          const found = fileSystem.find(
            (n) => n.parentId === currentFolderId && n.name.toLowerCase() === target.toLowerCase()
          );
          if (found) {
            deleteFSNode(found.id);
            outputLines.push({ id: `out-${Date.now()}`, type: 'success', text: `Removed: ${target}` });
          } else {
            outputLines.push({ id: `out-${Date.now()}`, type: 'error', text: `rm: "${target}" not found` });
          }
        }
        break;
      }

      case 'echo':
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: args.join(' '),
        });
        break;

      default:
        outputLines.push({
          id: `out-${Date.now()}`,
          type: 'error',
          text: `Command not recognized: "${cmd}". Type "help" to view valid commands.`,
        });
        break;
    }

    setLines((prev) => [...prev, inputLine, ...outputLines]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] || '');
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="h-full w-full flex flex-col bg-[#060a14] text-slate-200 font-mono text-xs select-text overflow-hidden"
    >
      {/* Top Terminal Strip */}
      <div className="h-8 px-3 bg-slate-950/80 border-b border-white/5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>nexus-bash — {currentFolder.name}</span>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Clear screen (or type 'clear')"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Main Terminal Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 leading-relaxed">
        {lines.map((line) => {
          let colorClass = 'text-slate-300';
          if (line.type === 'input') colorClass = 'text-cyan-400 font-medium';
          if (line.type === 'error') colorClass = 'text-rose-400 font-semibold';
          if (line.type === 'success') colorClass = 'text-emerald-400';
          if (line.type === 'system') colorClass = 'text-slate-400 italic';

          return (
            <div key={line.id} className={`whitespace-pre-wrap ${colorClass}`}>
              {line.text}
            </div>
          );
        })}

        {/* Prompt Input Line */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-cyan-400 font-semibold shrink-0">
            {settings.username.toLowerCase()}@nexus:~/{currentFolder.name}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-slate-100 p-0 m-0"
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
