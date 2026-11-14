import React, { useEffect, useRef } from 'react';
import { Bell, Trash2, CheckCheck, X, Sparkles, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useOSStore } from '../../store/osStore';

export const NotificationCenter: React.FC = () => {
  const isNotificationCenterOpen = useOSStore((s) => s.isNotificationCenterOpen);
  const toggleNotificationCenter = useOSStore((s) => s.toggleNotificationCenter);
  const notifications = useOSStore((s) => s.notifications);
  const clearNotifications = useOSStore((s) => s.clearNotifications);
  const markNotificationsRead = useOSStore((s) => s.markNotificationsRead);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNotificationCenterOpen) {
      markNotificationsRead();
    }
  }, [isNotificationCenterOpen, markNotificationsRead]);

  if (!isNotificationCenterOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'system':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-14 right-4 w-80 max-h-[500px] rounded-2xl glass-dropdown border border-white/10 text-slate-200 select-none shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-150"
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Notifications</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
            {notifications.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={toggleNotificationCenter}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No active notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderIcon(n.type)}
                  <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed pl-6">
                {n.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
