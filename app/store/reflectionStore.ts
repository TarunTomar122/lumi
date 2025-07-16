import { create } from 'zustand';
import { clientTools } from '@/utils/tools';
import type { Reflection } from '@/utils/database';
import { DateTime } from 'luxon';
import { ReflectionReminderService } from '@/utils/reflectionReminder';

interface ReflectionState {
  reflections: Reflection[];
  setReflections: (reflections: Reflection[]) => void;
  addReflection: (date: string, content: string) => Promise<void>;
  updateReflection: (id: number, updates: { date?: string; content?: string }) => Promise<void>;
  deleteReflection: (id: number) => Promise<void>;
  refreshReflections: () => Promise<void>;
}

export const useReflectionStore = create<ReflectionState>((set, get) => ({
  reflections: [],

  setReflections: reflections => set({ reflections }),

  addReflection: async (date, content) => {
    // First check if there's already a reflection for this date
    const existingReflection = get().reflections.find(
      r => DateTime.fromISO(r.date).toISODate() === DateTime.fromISO(date).toISODate()
    );

    if (existingReflection) {
      // If there is, append the new content to it
      const newContent = `${existingReflection.content}\n\n${content}`;
      const result = await clientTools.updateReflection({
        id: existingReflection.id!,
        content: newContent,
      });
      if (result.success) {
        set(state => ({
          reflections: state.reflections.map(reflection =>
            reflection.id === existingReflection.id
              ? { ...reflection, content: newContent }
              : reflection
          ),
        }));
        // Cancel any pending reflection reminders since user added reflection
        ReflectionReminderService.onReflectionAdded();
      }
    } else {
      // If there isn't, create a new reflection
      const result = await clientTools.addReflection({ date, content });
      if (result.success && result.reflection) {
        set(state => ({
          reflections: [result.reflection, ...state.reflections],
        }));
        // Cancel any pending reflection reminders since user added reflection
        ReflectionReminderService.onReflectionAdded();
      }
    }
  },

  updateReflection: async (id, updates) => {
    const result = await clientTools.updateReflection({ id, ...updates });
    if (result.success) {
      set(state => ({
        reflections: state.reflections.map(reflection =>
          reflection.id === id ? { ...reflection, ...updates } : reflection
        ),
      }));
    }
  },

  deleteReflection: async id => {
    const result = await clientTools.deleteReflection({ id });
    if (result.success) {
      set(state => ({
        reflections: state.reflections.filter(reflection => reflection.id !== id),
      }));
    }
  },

  refreshReflections: async () => {
    const result = await clientTools.getAllReflections();
    // sort the reflections by date
    const sortedReflections = result.reflections?.sort((a, b) => {
      return DateTime.fromISO(b.date).diff(DateTime.fromISO(a.date)).toMillis();
    });
    if (result.success && sortedReflections) {
      set({ reflections: sortedReflections });
      // Check if reminder needs to be scheduled after refreshing reflections
      ReflectionReminderService.checkAndScheduleReminder();
    }
  },
}));
