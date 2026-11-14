import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalIcon, 
  Clock, 
  Trash2, 
  Edit3, 
  Tag, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { useOSStore } from '../../../store/osStore';
import { CalendarEvent } from '../../../types/os';

export const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventTime, setEventTime] = useState('12:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('work');
  const [description, setDescription] = useState('');

  const calendarEvents = useOSStore((s) => s.calendarEvents);
  const addCalendarEvent = useOSStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useOSStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useOSStore((s) => s.deleteCalendarEvent);
  const fetchCalendarEvents = useOSStore((s) => s.fetchCalendarEvents);

  React.useEffect(() => {
    fetchCalendarEvents?.();
  }, [fetchCalendarEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyPrefix = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleOpenCreateModal = (dateToUse?: string) => {
    setEditingEventId(null);
    setTitle('');
    setEventDate(dateToUse || selectedDate);
    setEventTime('12:00');
    setCategory('work');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setEventDate(evt.date);
    setEventTime(evt.time || '12:00');
    setCategory(evt.category);
    setDescription(evt.description || '');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEventId) {
      updateCalendarEvent(editingEventId, {
        title: title.trim(),
        date: eventDate,
        time: eventTime,
        category,
        description: description.trim(),
      });
    } else {
      addCalendarEvent({
        title: title.trim(),
        date: eventDate,
        time: eventTime,
        category,
        description: description.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const eventsForSelectedDate = calendarEvents.filter((e) => e.date === selectedDate);

  const categoryColors: Record<CalendarEvent['category'], { bg: string; text: string; dot: string }> = {
    work: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
    personal: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
    system: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    deadline: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-300', dot: 'bg-rose-400' },
  };

  return (
    <div className="flex h-full w-full bg-[#080d19] text-slate-200 select-none">
      {/* Calendar Grid View (Left side) */}
      <div className="flex-1 flex flex-col p-4 border-r border-white/5 overflow-y-auto">
        {/* Month Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-wide">{monthName}</h2>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(todayStr);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenCreateModal()}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Day of Week Row */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
          {emptyPrefix.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] rounded-xl bg-slate-950/20" />
          ))}

          {daysArray.map((d) => {
            const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = formattedDay === todayStr;
            const isSelected = formattedDay === selectedDate;
            const dayEvents = calendarEvents.filter((e) => e.date === formattedDay);

            return (
              <div
                key={d}
                onClick={() => setSelectedDate(formattedDay)}
                className={`group min-h-[64px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-400/80 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                    : isToday
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/5 bg-slate-950/40 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center'
                        : isSelected
                        ? 'text-cyan-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {d}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event previews in calendar square */}
                <div className="space-y-0.5 mt-1">
                  {dayEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="px-1 py-0.5 rounded text-[9px] font-medium truncate text-white bg-white/10 border border-white/5"
                    >
                      {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-slate-500 text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda & Event Details Sidebar (Right side) */}
      <div className="w-80 bg-slate-950/70 p-4 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
          <div>
            <div className="text-xs font-semibold text-slate-400">Events for Date</div>
            <div className="text-sm font-bold text-white font-mono">{selectedDate}</div>
          </div>
          <button
            onClick={() => handleOpenCreateModal(selectedDate)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors"
            title="Create event on this date"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Event List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {eventsForSelectedDate.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <CalIcon className="w-8 h-8 opacity-30 mx-auto text-slate-400" />
              <p>No events scheduled for this day.</p>
              <button
                onClick={() => handleOpenCreateModal(selectedDate)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Schedule an event
              </button>
            </div>
          ) : (
            eventsForSelectedDate.map((evt) => {
              const catTheme = categoryColors[evt.category] || categoryColors.work;
              return (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border ${catTheme.bg} space-y-1.5 transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-white leading-snug">
                      {evt.title}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(evt)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                        title="Edit event"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCalendarEvent(evt.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{evt.time || 'All Day'}</span>
                    <span>·</span>
                    <span className="capitalize">{evt.category}</span>
                  </div>

                  {evt.description && (
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1 border-t border-white/5">
                      {evt.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal for Event Creation / Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEvent}
            className="w-full max-w-md rounded-2xl glass-dropdown border border-white/10 p-5 space-y-4 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingEventId ? 'Edit Event' : 'Schedule New Event'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Security Review"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                >
                  <option value="work">Work Project</option>
                  <option value="personal">Personal Agenda</option>
                  <option value="system">System Maintenance</option>
                  <option value="deadline">Sprint Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional agenda details, checklist, or location..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {editingEventId ? 'Update Event' : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
