import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Check, Clock, Calendar, FileText, Loader2 } from 'lucide-react';
import { useNotesStore } from '../../../store/notesStore';

export const NotesApp: React.FC = () => {
  const notes = useNotesStore((s) => s.notes);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const setActiveNoteId = useNotesStore((s) => s.setActiveNoteId);
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const isSaving = useNotesStore((s) => s.isSaving);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleCreateNote = async () => {
    setIsSaved(false);
    await createNote();
    setIsSaved(true);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNote(id);
  };

  const handleUpdate = (field: 'title' | 'content', value: string) => {
    if (!activeNote) return;
    setIsSaved(false);
    updateNote(activeNote.id, { [field]: value });
    setTimeout(() => setIsSaved(true), 300);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-[#080d19] text-slate-200 select-none">
      {/* Sidebar: Notes List */}
      <div className="w-64 bg-slate-950/70 border-r border-white/5 flex flex-col shrink-0">
        {/* Header & Search */}
        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">All Notes</span>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-lg text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Notes Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No notes found
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === activeNote?.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-colors border text-left ${
                    isSelected
                      ? 'bg-white/10 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-200 truncate pr-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-sans">
                    {note.content || 'No content...'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>{note.updatedAt}</span>
                    <span className="text-[9px] uppercase tracking-wider">{note.category || 'Draft'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col min-w-0 select-text bg-[#070b14]">
        {activeNote ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdate('title', e.target.value)}
                  placeholder="Note Title..."
                  className="w-full bg-transparent text-base font-bold text-white outline-none border-none placeholder:text-slate-600"
                />
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                  <span>Created: {activeNote.createdAt}</span>
                  <span>·</span>
                  <span>Modified: {activeNote.updatedAt}</span>
                </div>
              </div>

              {/* Autosave badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[11px] text-slate-400 font-mono shrink-0">
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Autosaved</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="text-cyan-300">Saving...</span>
                  </>
                )}
              </div>
            </div>

            {/* Note Content Textarea */}
            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdate('content', e.target.value)}
              placeholder="Start typing your thoughts, markdown documentation, or code snippets..."
              className="flex-1 p-4 bg-transparent text-slate-200 text-xs font-sans leading-relaxed resize-none outline-none overflow-y-auto selection:bg-cyan-500/30"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <FileText className="w-10 h-10 opacity-30 text-slate-400" />
            <span>No notes in workspace</span>
            <button
              onClick={handleCreateNote}
              className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition-colors"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
