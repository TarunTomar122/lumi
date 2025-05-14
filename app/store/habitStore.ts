import { create } from 'zustand';

export interface Habit {
  id: string;
  title: string;
  progress: number; // 0-5 for tracking daily progress
  color: string; // Color for the habit's progress circles
}

interface HabitState {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  updateHabitProgress: (id: string, progress: number) => void;
  refreshHabits: () => Promise<void>;
}

// For now, we'll use some mock data
const mockHabits: Habit[] = [
  {
    id: '1',
    title: 'workout',
    progress: 2,
    color: '#00BCD4', // cyan
  },
  {
    id: '2',
    title: 'piano',
    progress: 2,
    color: '#FF9800', // orange
  },
  {
    id: '3',
    title: 'running',
    progress: 3,
    color: '#8BC34A', // light green
  },
];

export const useHabitStore = create<HabitState>((set) => ({
  habits: mockHabits,
  
  setHabits: (habits) => set({ habits }),
  
  updateHabitProgress: (id, progress) => 
    set((state) => ({
      habits: state.habits.map(habit =>
        habit.id === id ? { ...habit, progress } : habit
      ),
    })),

  refreshHabits: async () => {
    // For now, just reset to mock data
    // In the future, this would fetch from an API/database
    set({ habits: mockHabits });
  },
})); 