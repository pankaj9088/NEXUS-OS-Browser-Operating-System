import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, 
  FolderPlus, 
  FilePlus, 
  Trash2, 
  HardDrive, 
  ArrowLeft, 
  ArrowRight,
  ArrowUp,
  FileText, 
  FileCode, 
  FileJson, 
  FileArchive,
  ChevronRight,
  Upload, 
  Download, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  ArrowUpDown, 
  Edit2, 
  Check, 
  X, 
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Eye,
  Move,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Play,
  ExternalLink,
  Laptop,
  FolderOpen
} from 'lucide-react';
import { useOSStore } from '../../../store/osStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { useFileStore, SYSTEM_FOLDERS } from '../../../store/fileStore';
import { useAuthStore } from '../../../store/authStore';
import { api, ApiError } from '../../../services/apiClient';
import { FileSystemNode } from '../../../types/os';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'size' | 'date' | 'type';

export const FilesApp: React.FC = () => {
  const fileSystem = useFileStore((s) => s.fileSystem);
  const currentFolderId = useFileStore((s) => s.currentFolderId);
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId);
  const selectedNodeIds = useFileStore((s) => s.selectedNodeIds);
  const setSelectedNodeIds = useFileStore((s) => s.setSelectedNodeIds);
  const toggleSelectNode = useFileStore((s) => s.toggleSelectNode);
  const selectRange = useFileStore((s) => s.selectRange);
  const selectAllInFolder = useFileStore((s) => s.selectAllInFolder);
  const clearSelection = useFileStore((s) => s.clearSelection);
  const previewFileId = useFileStore((s) => s.previewFileId);
  const setPreviewFileId = useFileStore((s) => s.setPreviewFileId);
  const isUploading = useFileStore((s) => s.isUploading);
  const uploadProgress = useFileStore((s) => s.uploadProgress);
  const isLoading = useFileStore((s) => s.isLoading);

  const fetchFiles = useFileStore((s) => s.fetchFiles);
  const createFolder = useFileStore((s) => s.createFolder);
  const createFile = useFileStore((s) => s.createFile);
  const uploadMultipleFiles = useFileStore((s) => s.uploadMultipleFiles);
  const downloadFile = useFileStore((s) => s.downloadFile);
  const deleteFSNode = useFileStore((s) => s.deleteFSNode);
  const renameFSNode = useFileStore((s) => s.renameFSNode);
  const moveFSNode = useFileStore((s) => s.moveFSNode);
  const setActiveEditorFileId = useFileStore((s) => s.setActiveEditorFileId);
  const getFileViewUrl = useFileStore((s) => s.getFileViewUrl);
  const openApp = useOSStore((s) => s.openApp);

  // Local navigation history (Back / Forward)
  const [history, setHistory] = useState<string[]>([currentFolderId]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Layout & UI states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Modals & Action Dialogs
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<FileSystemNode[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [dialogInput, setDialogInput] = useState('');
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Fetch latest files on mount
  useEffect(() => {
    fetchFiles?.();
  }, [fetchFiles]);

  // Navigate to folder with history tracking
  const navigateToFolder = (folderId: string) => {
    if (folderId === currentFolderId) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setLastClickedId(null);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setCurrentFolderId(history[prev]);
      setLastClickedId(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setCurrentFolderId(history[next]);
      setLastClickedId(null);
    }
  };

  const handleUpLevel = () => {
    const current = fileSystem.find((n) => n.id === currentFolderId);
    if (current && current.parentId) {
      navigateToFolder(current.parentId);
    }
  };

  const currentFolder = fileSystem.find((n) => n.id === currentFolderId) || {
    id: 'desktop',
    name: 'Desktop',
    parentId: 'root',
    type: 'folder' as const,
    updatedAt: '',
  };

  // Breadcrumbs computation
  const breadcrumbs = useMemo(() => {
    const crumbs: FileSystemNode[] = [];
    let curr: FileSystemNode | undefined = fileSystem.find((n) => n.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = fileSystem.find((n) => n.id === curr?.parentId);
    }
    return crumbs;
  }, [fileSystem, currentFolderId]);

  // Items in active folder
  const itemsInFolder = useMemo(() => {
    let items = fileSystem.filter((n) => n.parentId === currentFolderId);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = fileSystem.filter(
        (n) => n.name.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query))
      );
    }

    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortField === 'date') {
        comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '');
      } else if (sortField === 'type') {
        comparison = (a.fileType || a.type).localeCompare(b.fileType || b.type);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [fileSystem, currentFolderId, searchQuery, sortField, sortAsc]);

  // Selected nodes details
  const selectedNodes = useMemo(() => {
    const idSet = new Set(selectedNodeIds);
    return fileSystem.filter((n) => idSet.has(n.id));
  }, [fileSystem, selectedNodeIds]);

  // Clean up any stale selectedNodeIds that no longer exist in fileSystem
  useEffect(() => {
    const existingIds = new Set(fileSystem.map((f) => f.id));
    const valid = selectedNodeIds.filter((id) => existingIds.has(id));
    if (valid.length !== selectedNodeIds.length) {
      setSelectedNodeIds(valid);
    }
  }, [fileSystem, selectedNodeIds, setSelectedNodeIds]);

  const previewNode = useMemo(() => {
    return fileSystem.find((n) => n.id === previewFileId) || null;
  }, [fileSystem, previewFileId]);

  // Drag and Drop file upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (!api.getToken() && !useAuthStore.getState().isAuthenticated) {
      useNotificationStore.getState().addNotification({
        title: 'Authentication Required',
        message: 'Please sign in to upload files to your cloud storage.',
        type: 'warning',
        app: 'Files',
      });
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadMultipleFiles(currentFolderId, e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!api.getToken() && !useAuthStore.getState().isAuthenticated) {
        useNotificationStore.getState().addNotification({
          title: 'Authentication Required',
          message: 'Please sign in to upload files to your cloud storage.',
          type: 'warning',
          app: 'Files',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      await uploadMultipleFiles(currentFolderId, e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete') {
        if (selectedNodeIds.length > 0 && !isDeleteConfirmOpen) {
          e.preventDefault();
          handleOpenDeleteConfirm();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllInFolder(currentFolderId);
      } else if (e.key === 'Escape') {
        if (isDeleteConfirmOpen) {
          setIsDeleteConfirmOpen(false);
          setItemsToDelete([]);
        } else if (isRenameOpen) {
          setIsRenameOpen(false);
        } else if (isNewFolderOpen) {
          setIsNewFolderOpen(false);
        } else if (isMoveModalOpen) {
          setIsMoveModalOpen(false);
        } else if (previewFileId) {
          setPreviewFileId(null);
        } else {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, isDeleteConfirmOpen, isRenameOpen, isNewFolderOpen, isMoveModalOpen, previewFileId, currentFolderId, selectAllInFolder, clearSelection, setPreviewFileId]);

  // Click & Selection handlers
  const handleItemClick = (e: React.MouseEvent, item: FileSystemNode) => {
    e.stopPropagation();

    if (e.shiftKey && lastClickedId) {
      const orderedIds = itemsInFolder.map((i) => i.id);
      selectRange(lastClickedId, item.id, orderedIds);
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelectNode(item.id, true);
      setLastClickedId(item.id);
    } else {
      toggleSelectNode(item.id, false);
      setLastClickedId(item.id);
    }
  };

  const handleItemDoubleClick = (item: FileSystemNode) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      setPreviewFileId(item.id);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogInput.trim()) return;
    await createFolder(currentFolderId, dialogInput.trim());
    setDialogInput('');
    setIsNewFolderOpen(false);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogInput.trim()) return;
    createFile(currentFolderId, dialogInput.trim());
    setDialogInput('');
    setIsNewFileOpen(false);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogInput.trim() || selectedNodeIds.length === 0) return;
    await renameFSNode(selectedNodeIds[0], dialogInput.trim());
    setDialogInput('');
    setIsRenameOpen(false);
  };

  // Open Delete confirmation dialog with snapshot of selected items
  const handleOpenDeleteConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Recompute current valid target items based on fileSystem
    const targets = fileSystem.filter((n) => selectedNodeIds.includes(n.id));

    if (targets.length === 0) {
      useNotificationStore.getState().addNotification({
        title: 'Selection Required',
        message: 'Please select one or more items to delete.',
        type: 'info',
        app: 'Files',
      });
      return;
    }

    // Protect system folders from deletion
    const hasSystemFolder = targets.some((t) => SYSTEM_FOLDERS.some((s) => s.id === t.id));
    if (hasSystemFolder) {
      useNotificationStore.getState().addNotification({
        title: 'Protected System Folder',
        message: 'System folders cannot be deleted.',
        type: 'warning',
        app: 'Files',
      });
      return;
    }

    setItemsToDelete(targets);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleteConfirmOpen(false);
    setItemsToDelete([]);
  };

  const handleDeleteConfirmed = async () => {
    if (itemsToDelete.length === 0) return;
    setIsDeleting(true);

    const deletedItems: FileSystemNode[] = [];
    const failedItems: { name: string; reason: string }[] = [];

    for (const item of itemsToDelete) {
      try {
        await deleteFSNode(item.id, true);
        deletedItems.push(item);
      } catch (err: any) {
        const reason = err instanceof ApiError ? err.message : (err?.message || 'Deletion failed');
        failedItems.push({ name: item.name, reason });
        console.error(`Failed to delete "${item.name}":`, err);
      }
    }

    setIsDeleting(false);
    setIsDeleteConfirmOpen(false);
    setItemsToDelete([]);

    // Clear only successfully deleted items from selection
    const deletedIdSet = new Set(deletedItems.map((d) => d.id));
    const remainingSelected = selectedNodeIds.filter((id) => !deletedIdSet.has(id));
    setSelectedNodeIds(remainingSelected);

    // Re-sync folder view with server
    await fetchFiles?.();

    if (deletedItems.length > 0 && failedItems.length === 0) {
      useNotificationStore.getState().addNotification({
        title: 'Items Deleted',
        message: deletedItems.length === 1
          ? `"${deletedItems[0].name}" was permanently removed.`
          : `Permanently removed ${deletedItems.length} items.`,
        type: 'info',
        app: 'Files',
      });
    } else if (failedItems.length > 0) {
      const errorMsg = failedItems.length === 1
        ? `Could not delete "${failedItems[0].name}": ${failedItems[0].reason}`
        : `Could not delete ${failedItems.length} item(s): ${failedItems.map((f) => `${f.name} (${f.reason})`).join('; ')}`;

      useNotificationStore.getState().addNotification({
        title: 'Deletion Failed',
        message: errorMsg,
        type: 'warning',
        app: 'Files',
      });
    }
  };

  const handleMoveConfirmed = async () => {
    if (targetMoveFolderId === null) return;
    for (const id of selectedNodeIds) {
      await moveFSNode(id, targetMoveFolderId);
    }
    setIsMoveModalOpen(false);
    setTargetMoveFolderId(null);
  };

  const handleDownloadSelected = async () => {
    for (const node of selectedNodes) {
      if (node.type === 'file') {
        await downloadFile(node.id);
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderItemIcon = (item: FileSystemNode, size = 'w-10 h-10') => {
    if (item.type === 'folder') {
      return <Folder className={`${size} text-cyan-400 drop-shadow-md`} fill="#06b6d4" fillOpacity={0.15} />;
    }
    switch (item.fileType) {
      case 'image':
        return <ImageIcon className={`${size} text-purple-400`} />;
      case 'video':
        return <VideoIcon className={`${size} text-rose-400`} />;
      case 'audio':
        return <MusicIcon className={`${size} text-amber-400`} />;
      case 'code':
        return <FileCode className={`${size} text-emerald-400`} />;
      case 'json':
        return <FileJson className={`${size} text-amber-300`} />;
      case 'pdf':
        return <FileText className={`${size} text-red-400`} />;
      case 'archive':
        return <FileArchive className={`${size} text-yellow-400`} />;
      default:
        return <FileText className={`${size} text-slate-300`} />;
    }
  };

  const quickAccessFolders = [
    { id: 'desktop', name: 'Desktop', icon: Laptop },
    { id: 'docs', name: 'Documents', icon: Folder },
    { id: 'downloads', name: 'Downloads', icon: Download },
    { id: 'photos', name: 'Photos', icon: ImageIcon },
    { id: 'videos', name: 'Videos', icon: VideoIcon },
    { id: 'music', name: 'Music', icon: MusicIcon },
    { id: 'code', name: 'Developer', icon: FileCode },
  ];

  const allUserFolders = fileSystem.filter(
    (n) => n.type === 'folder' && !SYSTEM_FOLDERS.some((s) => s.id === n.id)
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-full w-full bg-[#070b14] text-slate-200 select-none overflow-hidden font-sans"
    >
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-cyan-950/80 backdrop-blur-md border-2 border-dashed border-cyan-400 rounded-xl flex flex-col items-center justify-center p-8 pointer-events-none animate-in fade-in duration-150">
          <Upload className="w-16 h-16 text-cyan-400 animate-bounce mb-3" />
          <h3 className="text-lg font-bold text-white tracking-wide">Drop files to upload to Nexus Storage</h3>
          <p className="text-xs text-cyan-300 font-mono mt-1">Files will be uploaded directly to "{currentFolder.name}"</p>
        </div>
      )}

      {/* =========================================================================
          TOP COMMAND RIBBON / TOOLBAR (Windows-Style)
         ========================================================================= */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="flex flex-col border-b border-white/10 bg-slate-950/90 shrink-0"
      >
        {/* Navigation Bar (Back, Forward, Up, Breadcrumbs, Search) */}
        <div className="flex items-center gap-2 p-2.5 border-b border-white/5">
          <div className="flex items-center gap-1">
            <button
              onClick={handleBack}
              disabled={historyIndex === 0}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Back (Alt + Left Arrow)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Forward (Alt + Right Arrow)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpLevel}
              disabled={!currentFolder.parentId}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Up one level (Alt + Up Arrow)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchFiles?.()}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh files"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Interactive Breadcrumb Address Bar */}
          <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs overflow-x-auto min-w-0">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <button
              onClick={() => navigateToFolder('root')}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              This PC
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className={`shrink-0 hover:text-cyan-300 transition-colors font-medium ${
                    crumb.id === currentFolderId ? 'text-cyan-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${currentFolder.name}...`}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 overflow-x-auto gap-2">
          {/* Creation & Upload Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setDialogInput('New Folder');
                setIsNewFolderOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-500/40 text-cyan-300 font-medium transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Folder</span>
            </button>

            <button
              onClick={() => {
                setDialogInput('Document.txt');
                setIsNewFileOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New File</span>
            </button>

            <button
              onClick={() => {
                if (!api.getToken() && !useAuthStore.getState().isAuthenticated) {
                  useNotificationStore.getState().addNotification({
                    title: 'Authentication Required',
                    message: 'Please sign in to upload files to your cloud storage.',
                    type: 'warning',
                    app: 'Files',
                  });
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* Contextual & Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Rename button (active when single item selected) */}
            {selectedNodeIds.length === 1 && (
              <button
                onClick={() => {
                  const node = selectedNodes[0];
                  if (node) {
                    setDialogInput(node.name);
                    setIsRenameOpen(true);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rename</span>
              </button>
            )}

            {/* Move button (active when 1+ items selected) */}
            {selectedNodeIds.length > 0 && (
              <button
                onClick={() => setIsMoveModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Move</span>
              </button>
            )}

            {/* Download button (active when file selected) */}
            {selectedNodes.some((n) => n.type === 'file') && (
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Download</span>
              </button>
            )}

            {/* Preview button (active when 1 file selected) */}
            {selectedNodes.length === 1 && selectedNodes[0].type === 'file' && (
              <button
                onClick={() => setPreviewFileId(selectedNodes[0].id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Preview</span>
              </button>
            )}

            {/* Delete button: always present, enabled when items are selected, disabled when 0 items */}
            <button
              type="button"
              onClick={(e) => handleOpenDeleteConfirm(e)}
              disabled={selectedNodes.length === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                selectedNodes.length > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 shadow-sm cursor-pointer'
                  : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={selectedNodes.length > 0 ? `Delete ${selectedNodes.length} item(s)` : 'Select one or more items to delete'}
            >
              <Trash2 className={`w-3.5 h-3.5 ${selectedNodes.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Delete{selectedNodes.length > 0 ? ` (${selectedNodes.length})` : ''}</span>
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Sorting Menu */}
            <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900 border border-white/5">
              <span className="text-[10px] text-slate-500 font-mono">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="name" className="bg-slate-900">Name</option>
                <option value="date" className="bg-slate-900">Date</option>
                <option value="size" className="bg-slate-900">Size</option>
                <option value="type" className="bg-slate-900">Type</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 hover:text-white"
                title={sortAsc ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Details list view"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Progress Indicator */}
        {isUploading && (
          <div className="w-full bg-cyan-950/40 px-4 py-1.5 border-t border-cyan-500/20 flex items-center justify-between gap-3 text-xs text-cyan-300 font-mono animate-in fade-in">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Uploading file to enclave storage...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-bold">{uploadProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MAIN WORKSPACE: LEFT NAVIGATION SIDEBAR + FILE VIEWPORT
         ========================================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Windows-Style Navigation Pane */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="w-56 bg-slate-950/70 border-r border-white/10 flex flex-col shrink-0 select-none overflow-y-auto p-2 space-y-4"
        >
          {/* Quick Access / Core Folders */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
              Quick Access
            </div>
            <div className="space-y-0.5">
              {quickAccessFolders.map((q) => {
                const IconComponent = q.icon;
                const isActive = currentFolderId === q.id;
                const count = fileSystem.filter((f) => f.parentId === q.id).length;

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToFolder(q.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="truncate">{q.name}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 px-1 rounded bg-black/40">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Folders Directory Tree */}
          {allUserFolders.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
                Folders ({allUserFolders.length})
              </div>
              <div className="space-y-0.5">
                {allUserFolders.map((f) => {
                  const isActive = currentFolderId === f.id;
                  const childCount = fileSystem.filter((child) => child.parentId === f.id).length;

                  return (
                    <button
                      key={f.id}
                      onClick={() => navigateToFolder(f.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      {childCount > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 px-1 rounded bg-black/40">
                          {childCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drive Status Indicator */}
          <div className="pt-4 mt-auto border-t border-white/5 px-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Virtual Enclave (C:)</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-1/4 rounded-full" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              {fileSystem.length} items cataloged
            </div>
          </div>
        </div>

        {/* Viewport: Files and Folders Display */}
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearSelection();
            }
          }}
          className="flex-1 flex flex-col min-w-0 bg-[#060a12] overflow-y-auto p-4 select-none"
        >
          {itemsInFolder.length === 0 ? (
            /* Empty State */
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) clearSelection();
              }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">This folder is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Drag and drop files here, or use the toolbar buttons to upload files and create new folders.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  Upload Files
                </button>
                <button
                  onClick={() => {
                    setDialogInput('New Folder');
                    setIsNewFolderOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* =========================================================================
               GRID VIEW
               ========================================================================= */
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) clearSelection();
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
            >
              {itemsInFolder.map((item) => {
                const isSelected = selectedNodeIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleItemClick(e, item)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleItemDoubleClick(item);
                    }}
                    className={`group relative flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'bg-slate-900/40 border-white/5 hover:bg-white/5 hover:border-white/15 text-slate-200'
                    }`}
                  >
                    {/* Visual Checkbox Indicator for Selection */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectNode(item.id, true);
                      }}
                      className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 opacity-100 shadow-sm'
                          : 'border-white/20 bg-slate-950/60 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Item Thumbnail or Icon */}
                    <div className="relative w-16 h-16 flex items-center justify-center mb-2 overflow-hidden rounded-lg bg-slate-950/60">
                      {item.type === 'file' && item.fileType === 'image' ? (
                        <img
                          src={getFileViewUrl(item.id)}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        renderItemIcon(item, 'w-10 h-10')
                      )}

                      {/* Video playback badge */}
                      {item.fileType === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white/80" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="w-full text-center">
                      <p
                        className={`text-xs font-medium truncate w-full px-1 ${
                          isSelected ? 'text-cyan-200 font-bold' : 'text-slate-200 group-hover:text-white'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.type === 'folder'
                          ? `${fileSystem.filter((f) => f.parentId === item.id).length} items`
                          : formatFileSize(item.size)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =========================================================================
               DETAILED LIST VIEW
               ========================================================================= */
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-mono text-[11px]">
                    <th className="py-2 px-3 font-semibold w-8">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="py-2 px-3 font-semibold">Name</th>
                    <th className="py-2 px-3 font-semibold">Date modified</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {itemsInFolder.map((item) => {
                    const isSelected = selectedNodeIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        onClick={(e) => handleItemClick(e, item)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleItemDoubleClick(item);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/25 border-l-2 border-cyan-400 text-cyan-200 font-medium'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-2 px-3 w-8">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectNode(item.id, true);
                            }}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'border-white/20 bg-slate-900/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </td>
                        <td className="py-2 px-3 flex items-center gap-2.5">
                          {renderItemIcon(item, 'w-4 h-4')}
                          <span className={`truncate max-w-xs ${isSelected ? 'font-bold text-white' : ''}`}>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {item.updatedAt}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {item.type === 'folder' ? 'File folder' : `${item.fileType || 'file'} document`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {item.type === 'folder' ? '—' : formatFileSize(item.size)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM STATUS BAR
         ========================================================================= */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="h-7 bg-slate-950 border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0"
      >
        <div className="flex items-center gap-4">
          <span>{itemsInFolder.length} items</span>
          {selectedNodeIds.length > 0 && (
            <span className="text-cyan-400 font-semibold">
              {selectedNodeIds.length} item{selectedNodeIds.length > 1 ? 's' : ''} selected
              {selectedNodes.some((n) => n.size) && ` (${formatFileSize(selectedNodes.reduce((acc, curr) => acc + (curr.size || 0), 0))})`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Nexus Enclave Filesystem: Synced</span>
        </div>
      </div>

      {/* =========================================================================
          MODALS & DIALOGS
         ========================================================================= */}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              <span>Create New Folder</span>
            </div>
            <input
              type="text"
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder="Folder Name"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New File Modal */}
      {isNewFileOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <form
            onSubmit={handleCreateFile}
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FilePlus className="w-4 h-4 text-emerald-400" />
              <span>Create New Document</span>
            </div>
            <input
              type="text"
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder="File Name (e.g. notes.txt)"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFileOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <form
            onSubmit={handleRename}
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Edit2 className="w-4 h-4 text-cyan-400" />
              <span>Rename Item</span>
            </div>
            <input
              type="text"
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder="New Name"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div
          onClick={handleDeleteCancel}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Delete Permanently</span>
            </div>

            {itemsToDelete.length === 0 ? (
              <p className="text-xs text-slate-300">No items are currently selected for deletion.</p>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-white">
                    {itemsToDelete.length === 1 ? `"${itemsToDelete[0].name}"` : `${itemsToDelete.length} items`}
                  </strong>
                  ? This action cannot be undone.
                </p>

                {/* Items preview list */}
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-950/80 rounded-xl border border-white/5 my-2">
                  {itemsToDelete.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-slate-200 truncate">
                      {renderItemIcon(item, 'w-3.5 h-3.5 shrink-0')}
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">
                        {item.type === 'folder' ? 'Folder' : formatFileSize(item.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCancel}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              {itemsToDelete.length > 0 && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirmed}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {isMoveModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsMoveModalOpen(false);
          }}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Move className="w-4 h-4 text-amber-400" />
              <span>Move Selected to Folder</span>
            </div>
            <p className="text-xs text-slate-400">
              Select destination directory for {selectedNodes.length} item{selectedNodes.length > 1 ? 's' : ''}:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-950 rounded-xl border border-white/5">
              {fileSystem
                .filter((n) => n.type === 'folder' && !selectedNodeIds.includes(n.id))
                .map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setTargetMoveFolderId(folder.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      targetMoveFolderId === folder.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{folder.name}</span>
                  </button>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMoveModalOpen(false);
                  setTargetMoveFolderId(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetMoveFolderId}
                onClick={handleMoveConfirmed}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold text-xs"
              >
                Move Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MEDIA & FILE PREVIEW LIGHTBOX MODAL
         ========================================================================= */}
      {previewNode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPreviewFileId(null);
          }}
          className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150"
        >
          {/* Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0"
          >
            <div className="flex items-center gap-3">
              {renderItemIcon(previewNode, 'w-5 h-5')}
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">{previewNode.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatFileSize(previewNode.size)} · Modified {previewNode.updatedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadFile(previewNode.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {['code', 'text', 'json'].includes(previewNode.fileType || '') && (
                <button
                  onClick={() => {
                    setActiveEditorFileId(previewNode.id);
                    openApp('editor', `Nexus Code - ${previewNode.name}`);
                    setPreviewFileId(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Editor</span>
                </button>
              )}

              <button
                onClick={() => setPreviewFileId(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Viewport Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center min-h-0 overflow-auto p-4"
          >
            {previewNode.fileType === 'image' ? (
              <img
                src={getFileViewUrl(previewNode.id)}
                alt={previewNode.name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
            ) : previewNode.fileType === 'video' ? (
              <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center">
                <video
                  src={getFileViewUrl(previewNode.id)}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh]"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            ) : previewNode.fileType === 'audio' ? (
              <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/30 mx-auto flex items-center justify-center">
                  <MusicIcon className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
                <div className="font-bold text-white text-base">{previewNode.name}</div>
                <audio
                  src={getFileViewUrl(previewNode.id)}
                  controls
                  autoPlay
                  className="w-full mt-2"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : previewNode.fileType === 'pdf' ? (
              <iframe
                src={getFileViewUrl(previewNode.id)}
                title={previewNode.name}
                className="w-full h-full max-w-5xl rounded-2xl border border-white/10 bg-white"
              />
            ) : (
              <div className="w-full max-w-4xl h-full bg-slate-950 border border-white/10 rounded-2xl p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed">
                <pre className="whitespace-pre-wrap selection:bg-cyan-500/30">
                  {previewNode.content || 'No text preview available.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
