import React, { useState, useEffect } from 'react';
import { Wifi, Volume2, VolumeX, Battery, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { useOSStore } from '../../store/osStore';

export const SystemTray: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const settings = useOSStore((s) => s.settings);
  const toggleCalendar = useOSStore((s) => s.toggleCalendar);
  const toggleNotificationCenter = useOSStore((s) => s.toggleNotificationCenter);
  const toggleSound = useOSStore((s) => s.toggleSound);
  const notifications = useOSStore((s) => s.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const is24h = settings.clockFormat === '24h';
      const showSec = settings.showSeconds;

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: showSec ? '2-digit' : undefined,
        hour12: !is24h,
      };

      setTimeStr(now.toLocaleTimeString([], timeOptions));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.clockFormat, settings.showSeconds]);

  return (
    <div className="flex items-center gap-1.5 px-2 text-xs select-none">
      {/* Network */}
      <div
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Wi-Fi: Nexus Quantum Mesh (Connected)"
      >
        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
      </div>

      {/* Sound */}
      <button
        onClick={toggleSound}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title={settings.soundEnabled ? 'Sound: Enabled' : 'Sound: Muted'}
      >
        {settings.soundEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-slate-300" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
        )}
      </button>

      {/* Battery */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Battery: 98% (Power Connected)"
      >
        <Battery className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      {/* Notification Bell */}
      <button
        onClick={toggleNotificationCenter}
        className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
        )}
      </button>

      {/* System Clock & Calendar trigger */}
      <button
        onClick={toggleCalendar}
        className="flex flex-col items-end px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors text-right"
        title="View Date & Calendar"
      >
        <span className="text-[11px] font-mono font-medium text-slate-200 leading-tight">
          {timeStr}
        </span>
        <span className="text-[9px] font-sans text-slate-400 leading-tight">
          {dateStr}
        </span>
      </button>
    </div>
  );
};
