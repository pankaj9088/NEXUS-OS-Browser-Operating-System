import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { WindowState } from '../../types/os';
import { useOSStore, APP_REGISTRY } from '../../store/osStore';
import { AppIcon } from '../common/AppIcon';
import { ACCENT_THEMES } from '../../utils/theme';

interface AppWindowProps {
  windowState: WindowState;
  children: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const AppWindow: React.FC<AppWindowProps> = ({ windowState, children }) => {
  const {
    id,
    appId,
    title,
    icon,
    x,
    y,
    width,
    height,
    isMinimized,
    isMaximized,
    zIndex,
  } = windowState;

  const appDef = APP_REGISTRY[appId];
  const minWidth = appDef?.minWidth || 360;
  const minHeight = appDef?.minHeight || 280;

  const activeWindowId = useOSStore((s) => s.activeWindowId);
  const accentColor = useOSStore((s) => s.settings.accentColor);
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.cyan;

  const focusWindow = useOSStore((s) => s.focusWindow);
  const closeWindow = useOSStore((s) => s.closeWindow);
  const minimizeWindow = useOSStore((s) => s.minimizeWindow);
  const maximizeWindow = useOSStore((s) => s.maximizeWindow);
  const updateWindowBounds = useOSStore((s) => s.updateWindowBounds);

  const isActive = activeWindowId === id;

  const windowRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const windowStartPosRef = useRef({ x: 0, y: 0 });

  // Resizing state
  const isResizingRef = useRef(false);
  const resizeDirRef = useRef<ResizeDirection | null>(null);
  const resizeStartBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const resizePointerStartRef = useRef({ x: 0, y: 0 });

  // Handle Dragging
  const handleTitlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0 || isMaximized) return;
    focusWindow(id);
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    windowStartPosRef.current = { x, y };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartPosRef.current.x;
      const dy = moveEvent.clientY - dragStartPosRef.current.y;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      // Keep window within viewport (title bar always reachable)
      const nextX = Math.max(10 - width + 80, Math.min(viewportW - 80, windowStartPosRef.current.x + dx));
      const nextY = Math.max(0, Math.min(viewportH - 60, windowStartPosRef.current.y + dy));

      updateWindowBounds(id, { x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle Resizing
  const handleResizePointerDown = (e: React.PointerEvent, dir: ResizeDirection) => {
    if (e.button !== 0 || isMaximized) return;
    e.stopPropagation();
    focusWindow(id);

    isResizingRef.current = true;
    resizeDirRef.current = dir;
    resizePointerStartRef.current = { x: e.clientX, y: e.clientY };
    resizeStartBoundsRef.current = { x, y, width, height };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isResizingRef.current || !resizeDirRef.current) return;
      const dx = moveEvent.clientX - resizePointerStartRef.current.x;
      const dy = moveEvent.clientY - resizePointerStartRef.current.y;
      const start = resizeStartBoundsRef.current;
      const direction = resizeDirRef.current;

      let nextX = start.x;
      let nextY = start.y;
      let nextW = start.width;
      let nextH = start.height;

      // East
      if (direction.includes('e')) {
        nextW = Math.max(minWidth, start.width + dx);
      }
      // West
      if (direction.includes('w')) {
        const potentialW = start.width - dx;
        if (potentialW >= minWidth) {
          nextW = potentialW;
          nextX = start.x + dx;
        } else {
          nextW = minWidth;
          nextX = start.x + (start.width - minWidth);
        }
      }
      // South
      if (direction.includes('s')) {
        nextH = Math.max(minHeight, start.height + dy);
      }
      // North
      if (direction.includes('n')) {
        const potentialH = start.height - dy;
        if (potentialH >= minHeight) {
          nextH = potentialH;
          nextY = start.y + dy;
        } else {
          nextH = minHeight;
          nextY = start.y + (start.height - minHeight);
        }
      }

      updateWindowBounds(id, { x: nextX, y: nextY, width: nextW, height: nextH });
    };

    const handlePointerUp = () => {
      isResizingRef.current = false;
      resizeDirRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (isMinimized) {
    return null;
  }

  // Styles for Maximized vs Normal
  const windowStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)', // Reserve 48px bottom for Taskbar
        zIndex,
        borderRadius: 0,
      }
    : {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      onPointerDown={() => focusWindow(id)}
      className={`flex flex-col rounded-xl overflow-hidden shadow-2xl transition-shadow duration-150 border select-none ${
        isActive
          ? 'ring-1 shadow-black/80'
          : 'opacity-95 shadow-black/60'
      } glass-panel`}
      style-border={{
        borderColor: isActive ? theme.border : 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={() => maximizeWindow(id)}
        className={`h-10 px-3 flex items-center justify-between border-b shrink-0 cursor-default transition-colors ${
          isActive
            ? 'bg-slate-900/80 border-white/10'
            : 'bg-slate-950/60 border-white/5 text-slate-400'
        }`}
      >
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          <div className={`p-1 rounded ${isActive ? theme.text : 'text-slate-400'}`}>
            <AppIcon name={icon} className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium tracking-wide truncate text-slate-200">
            {title}
          </span>
        </div>

        {/* Right: Window Controls */}
        <div 
          className="flex items-center gap-1.5 ml-2" 
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Minimize */}
          <button
            onClick={() => minimizeWindow(id)}
            title="Minimize"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore */}
          <button
            onClick={() => maximizeWindow(id)}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            {isMaximized ? (
              <Copy className="w-3.5 h-3.5 rotate-180" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={() => closeWindow(id)}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body (Content) */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-950/70 text-slate-100">
        {children}
      </div>

      {/* Resize Handles (Only when not maximized) */}
      {!isMaximized && (
        <>
          {/* Edges */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'n')}
            className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'w')}
            className="absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            className="absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize z-20"
          />

          {/* Corners */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-30"
          />
        </>
      )}
    </div>
  );
};
