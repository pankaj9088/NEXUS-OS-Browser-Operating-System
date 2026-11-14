import { create } from 'zustand';
import { FileSystemNode } from '../types/os';
import { useNotificationStore } from './notificationStore';
import { api, ApiError } from '../services/apiClient';

export const SYSTEM_FOLDERS: FileSystemNode[] = [
  { id: 'root', name: 'Root', type: 'folder', parentId: null, updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'desktop', name: 'Desktop', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'docs', name: 'Documents', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'downloads', name: 'Downloads', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'photos', name: 'Photos', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'videos', name: 'Videos', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'music', name: 'Music', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
  { id: 'code', name: 'Developer', type: 'folder', parentId: 'root', updatedAt: '2026-10-16', origin: 'sample' },
];

export const SAMPLE_FILES: FileSystemNode[] = [
  { 
    id: 'f-readme', 
    name: 'WELCOME.md', 
    type: 'file', 
    parentId: 'desktop', 
    fileType: 'text',
    mimeType: 'text/markdown',
    updatedAt: '2026-10-16', 
    createdAt: '2026-10-16',
    size: 780,
    origin: 'sample',
    content: `# Welcome to NEXUS OS\n\nA full-featured browser-based desktop operating system built with modern web technologies.\n\n### Highlights:\n- 🪟 **True Window Management**: Drag, resize from all 8 edges, minimize, maximize, and stack.\n- 🤖 **Nexus Copilot**: AI assistant with conversation history, streaming, and markdown code.\n- 📁 **Windows-Style File Explorer**: Left sidebar, breadcrumbs, search, multi-selection, drag & drop uploads.\n- 🖼️ **Media Previews**: Native photo lightbox, video player, and audio visualizer playback.\n- ⚡ **Interactive Terminal**: Virtual shell with file system commands and system diagnostics.\n- 📅 **Calendar**: Plan personal events, deadlines, and schedule meetings.\n- 🎶 **Synthesizer Lounge**: Real-time ambient audio player with visualizer.\n\nEnjoy the future of web computing!`
  },
  { 
    id: 'f-manifest', 
    name: 'sys_manifest.json', 
    type: 'file', 
    parentId: 'docs', 
    fileType: 'json',
    mimeType: 'application/json',
    updatedAt: '2026-10-16', 
    createdAt: '2026-10-16',
    size: 420,
    origin: 'sample',
    content: `{\n  "os": "NEXUS OS",\n  "version": "6.0.0",\n  "kernel": "WebEngine 2026.1",\n  "architecture": "x86_64_wasm",\n  "securityTier": "Enclave Sandboxed",\n  "fileManager": "Windows-Style Virtual Explorer",\n  "status": "Operational"\n}`
  },
  { 
    id: 'f-main-ts', 
    name: 'algorithm.ts', 
    type: 'file', 
    parentId: 'code', 
    fileType: 'code',
    mimeType: 'text/typescript',
    updatedAt: '2026-10-16', 
    createdAt: '2026-10-16',
    size: 512,
    origin: 'sample',
    content: `// Nexus OS Task Scheduling Heuristic\nexport interface Task {\n  id: string;\n  priority: number;\n  burstTime: number;\n}\n\nexport function scheduleTasks(tasks: Task[]): Task[] {\n  return [...tasks].sort((a, b) => b.priority - a.priority || a.burstTime - b.burstTime);\n}\n\nconsole.log("Nexus Scheduler loaded.");`
  },
  { 
    id: 'f-notes', 
    name: 'Roadmap.txt', 
    type: 'file', 
    parentId: 'docs', 
    fileType: 'text',
    mimeType: 'text/plain',
    updatedAt: '2026-10-16', 
    createdAt: '2026-10-16',
    size: 320,
    origin: 'sample',
    content: `Upcoming Milestones:\n1. Windows-style File Explorer with media previews\n2. Real-time drag and drop upload & move operations\n3. Breadcrumb navigation with nested folder hierarchies\n4. Cloud synchronization and access control`
  }
];

const INITIAL_FS = [...SYSTEM_FOLDERS, ...SAMPLE_FILES];

export const getFileType = (name: string, mime?: string): FileSystemNode['fileType'] => {
  const ext = name.toLowerCase().split('.').pop() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || mime?.startsWith('image/')) return 'image';
  if (['mp4', 'webm', 'ogv', 'mov', 'mkv'].includes(ext) || mime?.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mime?.startsWith('audio/')) return 'audio';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['zip', 'tar', 'gz', '7z'].includes(ext) || mime?.includes('zip') || mime?.includes('tar')) return 'archive';
  if (ext === 'json' || mime === 'application/json') return 'json';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'c', 'cpp', 'rs', 'html', 'css', 'sql', 'sh', 'env', 'xml', 'yaml', 'yml'].includes(ext)) return 'code';
  return 'text';
};

interface FileStoreState {
  fileSystem: FileSystemNode[];
  activeEditorFileId: string | null;
  currentFolderId: string;
  selectedNodeIds: string[];
  previewFileId: string | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  setCurrentFolderId: (id: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  toggleSelectNode: (id: string, isMulti?: boolean) => void;
  selectRange: (fromId: string, toId: string, allIds: string[]) => void;
  selectAllInFolder: (folderId: string) => void;
  clearSelection: () => void;
  setPreviewFileId: (id: string | null) => void;
  fetchFiles: () => Promise<void>;
  createFile: (parentId: string, name: string, content?: string, fileType?: FileSystemNode['fileType']) => string;
  createFolder: (parentId: string, name: string) => Promise<string>;
  uploadFile: (parentId: string, file: File, onProgress?: (pct: number) => void) => Promise<string>;
  uploadMultipleFiles: (parentId: string, files: FileList | File[]) => Promise<void>;
  downloadFile: (id: string) => Promise<void>;
  deleteFSNode: (id: string, silent?: boolean) => Promise<void>;
  deleteSelectedNodes: () => Promise<void>;
  updateFileContent: (id: string, content: string) => void;
  renameFSNode: (id: string, newName: string) => Promise<void>;
  moveFSNode: (id: string, targetFolderId: string | null) => Promise<void>;
  setActiveEditorFileId: (id: string | null) => void;
  getFileViewUrl: (id: string) => string;
}

export const useFileStore = create<FileStoreState>((set, get) => {
  let initial = INITIAL_FS;
  try {
    const raw = localStorage.getItem('nexus_os_fs');
    if (raw) initial = JSON.parse(raw);
  } catch {}

  const save = (nodes: FileSystemNode[]) => {
    try {
      localStorage.setItem('nexus_os_fs', JSON.stringify(nodes));
    } catch {}
  };

  return {
    fileSystem: initial,
    activeEditorFileId: 'f-readme',
    currentFolderId: 'desktop',
    selectedNodeIds: [],
    previewFileId: null,
    isLoading: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,

    setCurrentFolderId: (id) => set({ currentFolderId: id, selectedNodeIds: [] }),

    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

    toggleSelectNode: (id, isMulti = false) => {
      set((state) => {
        if (!isMulti) {
          return { selectedNodeIds: [id] };
        }
        if (state.selectedNodeIds.includes(id)) {
          return { selectedNodeIds: state.selectedNodeIds.filter((x) => x !== id) };
        } else {
          return { selectedNodeIds: [...state.selectedNodeIds, id] };
        }
      });
    },

    selectRange: (fromId, toId, allIds) => {
      const fromIdx = allIds.indexOf(fromId);
      const toIdx = allIds.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) {
        set({ selectedNodeIds: [toId] });
        return;
      }
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const range = allIds.slice(start, end + 1);
      set({ selectedNodeIds: range });
    },

    selectAllInFolder: (folderId) => {
      const items = get().fileSystem.filter((f) => f.parentId === folderId);
      set({ selectedNodeIds: items.map((i) => i.id) });
    },

    clearSelection: () => set({ selectedNodeIds: [] }),

    setPreviewFileId: (id) => set({ previewFileId: id }),

    getFileViewUrl: (id) => {
      const node = get().fileSystem.find((n) => n.id === id);
      if (node?.dataUrl) return node.dataUrl;
      const token = api.getToken();
      return `/api/files/${id}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    },

    fetchFiles: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get<{ files: any[] }>('/api/files');
        if (res && Array.isArray(res.files)) {
          const serverNodes: FileSystemNode[] = res.files.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.isFolder ? 'folder' : 'file',
            parentId: f.parentFolderId || (f.isFolder ? 'root' : 'desktop'),
            fileType: f.isFolder ? undefined : getFileType(f.name, f.mimeType),
            mimeType: f.mimeType,
            content: f.content || '',
            size: f.size || 0,
            updatedAt: new Date(f.updatedAt || Date.now()).toISOString().split('T')[0],
            createdAt: new Date(f.createdAt || Date.now()).toISOString().split('T')[0],
            origin: 'uploaded',
          }));

          const systemFolderIds = new Set(SYSTEM_FOLDERS.map((s) => s.id));
          const nonSystemServerNodes = serverNodes.filter((n) => !systemFolderIds.has(n.id));
          const combined = [...SYSTEM_FOLDERS, ...SAMPLE_FILES, ...nonSystemServerNodes];

          const uniqueMap = new Map<string, FileSystemNode>();
          combined.forEach((node) => uniqueMap.set(node.id, node));
          const merged = Array.from(uniqueMap.values());

          set({ fileSystem: merged, isLoading: false });
          save(merged);
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        set({ isLoading: false, error: err.message || null });
      }
    },

    createFile: (parentId, name, content = '', fileType = 'text') => {
      const id = `f-${Date.now()}`;
      const now = new Date().toISOString().split('T')[0];
      const node: FileSystemNode = {
        id,
        name,
        type: 'file',
        parentId,
        content,
        fileType,
        size: content.length,
        updatedAt: now,
        createdAt: now,
        origin: 'uploaded',
      };
      const updated = [...get().fileSystem, node];
      set({ fileSystem: updated });
      save(updated);
      return id;
    },

    createFolder: async (parentId, name) => {
      let id = `folder-${Date.now()}-${Math.round(Math.random() * 1e4)}`;
      const now = new Date().toISOString().split('T')[0];

      try {
        const res = await api.post<{ folder: any }>('/api/files/folders', {
          name,
          parentFolderId: parentId === 'root' ? null : parentId,
        });
        if (res && res.folder) {
          id = res.folder.id;
        }
      } catch (err) {
        console.warn('Backend createFolder fallback to local:', err);
      }

      const node: FileSystemNode = {
        id,
        name,
        type: 'folder',
        parentId,
        updatedAt: now,
        createdAt: now,
        origin: 'uploaded',
      };
      const updated = [...get().fileSystem, node];
      set({ fileSystem: updated });
      save(updated);

      useNotificationStore.getState().addNotification({
        title: 'Folder Created',
        message: `Folder "${name}" was created.`,
        type: 'success',
        app: 'Files',
      });

      return id;
    },

    uploadFile: async (parentId, file, onProgress) => {
      const now = new Date().toISOString().split('T')[0];
      const fileType = getFileType(file.name, file.type);
      set({ isUploading: true, uploadProgress: 10 });

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (parentId && parentId !== 'root') {
          formData.append('parentFolderId', parentId);
        }

        const res = await api.upload<{ file: any }>('/api/files/upload', formData, (pct) => {
          set({ uploadProgress: pct });
          onProgress?.(pct);
        });
        const serverFile = res.file;

        const node: FileSystemNode = {
          id: serverFile.id,
          name: serverFile.name,
          type: 'file',
          parentId,
          content: serverFile.content || '',
          size: serverFile.size,
          updatedAt: now,
          createdAt: now,
          fileType,
          mimeType: serverFile.mimeType,
          origin: 'uploaded',
        };

        const updated = [...get().fileSystem, node];
        set({ fileSystem: updated, isUploading: false, uploadProgress: 100 });
        save(updated);

        useNotificationStore.getState().addNotification({
          title: 'File Uploaded',
          message: `Successfully uploaded "${file.name}".`,
          type: 'success',
          app: 'Files',
        });

        return serverFile.id;
      } catch (err: any) {
        set({ isUploading: false, uploadProgress: 0 });
        const errorMsg = err instanceof ApiError ? err.message : 'File upload failed.';
        useNotificationStore.getState().addNotification({
          title: 'Upload Failed',
          message: errorMsg,
          type: 'warning',
          app: 'Files',
        });
        throw err;
      }
    },

    uploadMultipleFiles: async (parentId, files) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        try {
          await get().uploadFile(parentId, fileList[i]);
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (fileList.length > 1) {
        useNotificationStore.getState().addNotification({
          title: 'Batch Upload Complete',
          message: `Uploaded ${successCount} files${failCount > 0 ? `, ${failCount} failed` : ''}.`,
          type: failCount > 0 ? 'warning' : 'success',
          app: 'Files',
        });
      }
    },

    downloadFile: async (id) => {
      const node = get().fileSystem.find((n) => n.id === id);
      if (!node || node.type !== 'file') return;

      if (node.origin === 'sample' || (!node.id.startsWith('file-') && node.content)) {
        if (node.dataUrl) {
          const link = document.createElement('a');
          link.href = node.dataUrl;
          link.download = node.name;
          link.click();
        } else {
          const blob = new Blob([node.content || ''], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = node.name;
          link.click();
          URL.revokeObjectURL(url);
        }

        useNotificationStore.getState().addNotification({
          title: 'File Downloaded',
          message: `${node.name} exported locally.`,
          type: 'info',
          app: 'Files',
        });
        return;
      }

      try {
        await api.download(`/api/files/${id}/download`, node.name);
        useNotificationStore.getState().addNotification({
          title: 'Download Complete',
          message: `${node.name} downloaded from server.`,
          type: 'success',
          app: 'Files',
        });
      } catch (err: any) {
        useNotificationStore.getState().addNotification({
          title: 'Download Failed',
          message: err.message || 'Could not download file.',
          type: 'warning',
          app: 'Files',
        });
      }
    },

    deleteFSNode: async (id, silent = false) => {
      const node = get().fileSystem.find((n) => n.id === id);
      if (!node) return;

      // Protected system folders cannot be deleted
      if (SYSTEM_FOLDERS.some((s) => s.id === id)) {
        const errorMsg = 'System folders cannot be deleted.';
        if (!silent) {
          useNotificationStore.getState().addNotification({
            title: 'Protected Folder',
            message: errorMsg,
            type: 'warning',
            app: 'Files',
          });
        }
        throw new Error(errorMsg);
      }

      // 1. Call server API first for server-persisted items
      const isServerNode = id.startsWith('file-') || id.startsWith('folder-') || node.origin === 'uploaded';
      if (isServerNode) {
        try {
          await api.delete(`/api/files/${id}`);
          if (!silent) {
            useNotificationStore.getState().addNotification({
              title: 'Item Deleted',
              message: `"${node.name}" was permanently removed.`,
              type: 'info',
              app: 'Files',
            });
          }
        } catch (err: any) {
          const msg = err instanceof ApiError ? err.message : (err?.message || 'Failed to delete item from server.');
          if (!silent) {
            useNotificationStore.getState().addNotification({
              title: 'Deletion Failed',
              message: msg,
              type: 'warning',
              app: 'Files',
            });
          }
          throw new ApiError(msg, err?.status || 500);
        }
      }

      // 2. Compute descendant IDs to remove if it is a folder
      const idsToDelete = new Set<string>([id]);
      if (node.type === 'folder') {
        let changed = true;
        while (changed) {
          changed = false;
          for (const item of get().fileSystem) {
            if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
              idsToDelete.add(item.id);
              changed = true;
            }
          }
        }
      }

      // 3. Update local state only after server confirmation
      const updated = get().fileSystem.filter((n) => !idsToDelete.has(n.id));
      const remainingSelected = get().selectedNodeIds.filter((sid) => !idsToDelete.has(sid));
      set({ fileSystem: updated, selectedNodeIds: remainingSelected });
      save(updated);
    },

    deleteSelectedNodes: async () => {
      const selected = [...get().selectedNodeIds];
      if (selected.length === 0) return;

      const successfullyDeleted: string[] = [];
      for (const id of selected) {
        try {
          await get().deleteFSNode(id);
          successfullyDeleted.push(id);
        } catch (e) {
          console.warn(`Failed to delete node ${id}:`, e);
        }
      }

      const remainingSelected = get().selectedNodeIds.filter((id) => !successfullyDeleted.includes(id));
      set({ selectedNodeIds: remainingSelected });

      // Refresh from server to ensure consistent state
      await get().fetchFiles();
    },

    updateFileContent: (id, content) => {
      const now = new Date().toISOString().split('T')[0];
      const updated = get().fileSystem.map((n) =>
        n.id === id ? { ...n, content, size: content.length, updatedAt: now } : n
      );
      set({ fileSystem: updated });
      save(updated);
    },

    renameFSNode: async (id, newName) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      const now = new Date().toISOString().split('T')[0];
      const updated = get().fileSystem.map((n) =>
        n.id === id ? { ...n, name: trimmed, updatedAt: now } : n
      );
      set({ fileSystem: updated });
      save(updated);

      const targetNode = get().fileSystem.find((n) => n.id === id);
      const isServerNode = id.startsWith('file-') || id.startsWith('folder-') || targetNode?.origin === 'uploaded';
      if (isServerNode) {
        try {
          await api.patch(`/api/files/${id}`, { name: trimmed });
          useNotificationStore.getState().addNotification({
            title: 'Renamed',
            message: `Renamed to "${trimmed}".`,
            type: 'info',
            app: 'Files',
          });
        } catch (err: any) {
          const msg = err instanceof ApiError ? err.message : (err?.message || 'Failed to rename item.');
          useNotificationStore.getState().addNotification({
            title: 'Rename Failed',
            message: msg,
            type: 'warning',
            app: 'Files',
          });
          // Revert to previous file list
          await get().fetchFiles();
        }
      }
    },

    moveFSNode: async (id, targetFolderId) => {
      // Prevent moving folder into itself or its own descendants
      if (id === targetFolderId) return;

      const node = get().fileSystem.find((n) => n.id === id);
      if (!node) return;

      if (node.type === 'folder') {
        const isDescendant = (parentId: string | null): boolean => {
          if (!parentId) return false;
          if (parentId === id) return true;
          const parent = get().fileSystem.find((n) => n.id === parentId);
          return parent ? isDescendant(parent.parentId) : false;
        };
        if (isDescendant(targetFolderId)) {
          useNotificationStore.getState().addNotification({
            title: 'Invalid Move',
            message: 'Cannot move a folder into its own subfolder.',
            type: 'warning',
            app: 'Files',
          });
          return;
        }
      }

      const now = new Date().toISOString().split('T')[0];
      const updated = get().fileSystem.map((n) =>
        n.id === id ? { ...n, parentId: targetFolderId, updatedAt: now } : n
      );
      set({ fileSystem: updated });
      save(updated);

      const isServerNode = id.startsWith('file-') || id.startsWith('folder-') || node.origin === 'uploaded';
      if (isServerNode) {
        try {
          await api.patch(`/api/files/${id}`, { parentFolderId: targetFolderId === 'root' ? null : targetFolderId });
          const destName = get().fileSystem.find((n) => n.id === targetFolderId)?.name || 'folder';
          useNotificationStore.getState().addNotification({
            title: 'Moved Successfully',
            message: `Moved "${node.name}" into "${destName}".`,
            type: 'success',
            app: 'Files',
          });
        } catch (err: any) {
          const msg = err instanceof ApiError ? err.message : (err?.message || 'Failed to move item.');
          useNotificationStore.getState().addNotification({
            title: 'Move Failed',
            message: msg,
            type: 'warning',
            app: 'Files',
          });
          // Revert to previous file list
          await get().fetchFiles();
        }
      }
    },

    setActiveEditorFileId: (id) => set({ activeEditorFileId: id }),
  };
});
