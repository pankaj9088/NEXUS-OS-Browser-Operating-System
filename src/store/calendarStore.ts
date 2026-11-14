import { create } from 'zustand';
import { CalendarEvent } from '../types/os';
import { useNotificationStore } from './notificationStore';
import { api } from '../services/apiClient';

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Nexus OS Kernel Architecture Review',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    category: 'work',
    description: 'Review WASM hypervisor scheduling and memory pooling with team.',
  },
  {
    id: 'evt-2',
    title: 'Copilot AI Streaming Benchmark',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:30',
    category: 'system',
    description: 'Evaluate token generation latency and token throughput metrics.',
  },
  {
    id: 'evt-3',
    title: 'Hardware Acceleration Sprint Deadline',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '17:00',
    category: 'deadline',
    description: 'Finalize WebGL compositor layer shaders and visualizer buffers.',
  },
];

interface CalendarStoreState {
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  fetchCalendarEvents: () => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<string>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => {
  let initial = INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem('nexus_os_calendar');
    if (raw) initial = JSON.parse(raw);
  } catch {}

  const save = (events: CalendarEvent[]) => {
    try {
      localStorage.setItem('nexus_os_calendar', JSON.stringify(events));
    } catch {}
  };

  return {
    calendarEvents: initial,
    isLoading: false,
    error: null,

    fetchCalendarEvents: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.get<{ events: any[] }>('/api/events');
        if (res && Array.isArray(res.events)) {
          const mapped: CalendarEvent[] = res.events.map((e) => ({
            id: e.id,
            title: e.title,
            date: e.startDate,
            time: e.time || '12:00',
            category: e.category || 'work',
            description: e.description || '',
          }));
          set({ calendarEvents: mapped, isLoading: false });
          save(mapped);
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        set({ isLoading: false, error: err.message || null });
      }
    },

    addCalendarEvent: async (eventData) => {
      let id = `cal-${Date.now()}`;
      try {
        const res = await api.post<{ event: any }>('/api/events', {
          title: eventData.title,
          startDate: eventData.date,
          time: eventData.time || '12:00',
          category: eventData.category || 'work',
          description: eventData.description || '',
        });
        if (res && res.event) {
          id = res.event.id;
        }
      } catch (err) {
        console.warn('Backend event creation fallback to local:', err);
      }

      const newEvent: CalendarEvent = { ...eventData, id };
      const updated = [newEvent, ...get().calendarEvents];
      set({ calendarEvents: updated });
      save(updated);

      useNotificationStore.getState().addNotification({
        title: 'Event Scheduled',
        message: `"${eventData.title}" on ${eventData.date} added to calendar.`,
        type: 'success',
        app: 'Calendar',
      });

      return id;
    },

    updateCalendarEvent: async (id, updates) => {
      const updated = get().calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e));
      set({ calendarEvents: updated });
      save(updated);

      try {
        await api.patch(`/api/events/${id}`, {
          title: updates.title,
          startDate: updates.date,
          time: updates.time,
          category: updates.category,
          description: updates.description,
        });
      } catch (err) {
        console.warn('Backend event update skipped/failed:', err);
      }
    },

    deleteCalendarEvent: async (id) => {
      const updated = get().calendarEvents.filter((e) => e.id !== id);
      set({ calendarEvents: updated });
      save(updated);

      try {
        await api.delete(`/api/events/${id}`);
      } catch (err) {
        console.warn('Backend event delete skipped/failed:', err);
      }

      useNotificationStore.getState().addNotification({
        title: 'Event Removed',
        message: 'Calendar event removed.',
        type: 'info',
        app: 'Calendar',
      });
    },
  };
});
