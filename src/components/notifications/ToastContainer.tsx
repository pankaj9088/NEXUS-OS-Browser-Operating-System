import React, { useEffect } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useOSStore } from '../../store/osStore';

export const ToastContainer: React.FC = () => {
  const toasts = useOSStore((s) => s.toasts);
  const dismissToast = useOSStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const timer = setTimeout(() => {
      dismissToast(oldest.id);
    }, 4500);

    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

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
    <div className="fixed bottom-14 right-4 z-[99999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3 rounded-xl glass-dropdown border border-white/10 shadow-2xl flex items-start gap-3 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="mt-0.5 shrink-0">{renderIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              {toast.title}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
