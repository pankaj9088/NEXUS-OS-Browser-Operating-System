import React, { useState, useEffect, useRef } from 'react';
import { Save, Play, FileCode, Check, Eye } from 'lucide-react';
import { useOSStore } from '../../../store/osStore';

export const EditorApp: React.FC = () => {
  const fileSystem = useOSStore((s) => s.fileSystem);
  const activeEditorFileId = useOSStore((s) => s.activeEditorFileId);
  const setActiveEditorFileId = useOSStore((s) => s.setActiveEditorFileId);
  const updateFileContent = useOSStore((s) => s.updateFileContent);
  const addNotification = useOSStore((s) => s.addNotification);

  // Available files in fileSystem
  const editableFiles = fileSystem.filter((n) => n.type === 'file');

  const currentFile = editableFiles.find((f) => f.id === activeEditorFileId) || editableFiles[0];

  const [content, setContent] = useState(currentFile?.content || '');
  const [isSaved, setIsSaved] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [activeTabMode, setActiveTabMode] = useState<'code' | 'preview'>('code');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentFile) {
      setContent(currentFile.content || '');
      setIsSaved(true);
    }
  }, [currentFile?.id]);

  const handleSave = () => {
    if (currentFile) {
      updateFileContent(currentFile.id, content);
      setIsSaved(true);
      addNotification({
        title: 'File Saved',
        message: `${currentFile.name} was successfully saved to disk.`,
        type: 'success',
        app: 'Nexus Code',
      });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
    updateCursor(e.target);
  };

  const updateCursor = (target: HTMLTextAreaElement) => {
    const textBeforeCursor = target.value.substring(0, target.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const lineCount = content.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full w-full bg-[#070b14] text-slate-200 select-text font-mono">
      {/* Top File Tabs Bar */}
      <div className="h-10 bg-slate-950/70 border-b border-white/5 flex items-center justify-between px-2 shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {editableFiles.map((file) => {
            const isCurrent = file.id === currentFile?.id;
            return (
              <button
                key={file.id}
                onClick={() => {
                  if (!isSaved && currentFile) {
                    updateFileContent(currentFile.id, content);
                  }
                  setActiveEditorFileId(file.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs transition-colors border-t border-l border-r ${
                  isCurrent
                    ? 'bg-[#070b14] border-white/10 text-cyan-300 font-semibold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                {!isSaved && isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {currentFile?.name.endsWith('.md') && (
            <button
              onClick={() => setActiveTabMode(activeTabMode === 'code' ? 'preview' : 'code')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                activeTabMode === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{activeTabMode === 'preview' ? 'Editor' : 'Preview'}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-sans font-medium transition-colors ${
              isSaved
                ? 'bg-white/5 text-slate-500 cursor-default'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {activeTabMode === 'preview' ? (
          // Markdown Render View
          <div className="flex-1 p-6 overflow-y-auto text-slate-200 font-sans leading-relaxed space-y-4">
            <h1 className="text-xl font-bold text-white border-b border-white/10 pb-2">
              {currentFile?.name}
            </h1>
            <div className="whitespace-pre-wrap font-sans text-sm text-slate-300">
              {content}
            </div>
          </div>
        ) : (
          // Code Editor Area with Line Numbers
          <div className="flex-1 flex overflow-hidden">
            {/* Line numbers column */}
            <div className="w-12 py-3 bg-slate-950/40 text-right pr-3 select-none text-slate-600 font-mono text-xs leading-6 overflow-hidden border-r border-white/5">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyUp={(e) => updateCursor(e.currentTarget)}
              onClick={(e) => updateCursor(e.currentTarget)}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-6 resize-none outline-none overflow-y-auto selection:bg-cyan-500/30 whitespace-pre"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 px-3 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 select-none font-mono">
        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{lineCount} lines</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span>{currentFile?.name.split('.').pop()?.toUpperCase() || 'TXT'}</span>
        </div>
      </div>
    </div>
  );
};
