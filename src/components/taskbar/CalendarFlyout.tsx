import React from 'react';
import { useOSStore } from '../../store/osStore';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export const CalendarFlyout: React.FC = () => {
  const isCalendarOpen = useOSStore((s) => s.isCalendarOpen);
  const toggleCalendar = useOSStore((s) => s.toggleCalendar);

  if (!isCalendarOpen) return null;

  const today = new Date();
  const currentMonthName = today.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const dayOfWeek = today.toLocaleDateString([], { weekday: 'long' });
  const dateNum = today.getDate();

  // Simple days of month generator
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPrefix = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div className="fixed bottom-14 right-4 w-72 rounded-2xl glass-dropdown p-4 text-slate-200 select-none shadow-2xl z-[9999] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Date Header */}
      <div className="border-b border-white/10 pb-3 mb-3">
        <div className="text-xs text-cyan-400 font-medium">{dayOfWeek}</div>
        <div className="text-xl font-bold text-white">
          {today.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between text-xs font-semibold mb-3">
        <span>{currentMonthName}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-medium mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {emptyPrefix.map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}
        {daysArray.map((d) => {
          const isToday = d === dateNum;
          return (
            <div
              key={d}
              className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs font-mono transition-colors ${
                isToday
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* Focus agenda snippet */}
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>System Schedule</span>
        </div>
        <p className="text-[10px] text-slate-500">Autonomous state snapshot scheduled at midnight.</p>
      </div>
    </div>
  );
};
