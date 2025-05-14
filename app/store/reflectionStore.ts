import { create } from 'zustand';

export interface Reflection {
  id: string;
  date: string;
  text: string;
}

interface ReflectionState {
  reflections: Reflection[];
  setReflections: (reflections: Reflection[]) => void;
  addReflection: (reflection: Omit<Reflection, 'id'>) => void;
  refreshReflections: () => Promise<void>;
}

// For now, we'll use some mock data
const mockReflections: Reflection[] = [
  {
    id: '1',
    date: '13th may',
    text: 'that thing that happened yesterday was so good tbh',
  },
  {
    id: '2',
    date: '12th may',
    text: 'not the best day in terms of blah blah...',
  },
];

export const useReflectionStore = create<ReflectionState>((set) => ({
  reflections: mockReflections,
  
  setReflections: (reflections) => set({ reflections }),
  
  addReflection: (reflectionData) => 
    set((state) => ({
      reflections: [
        {
          id: Date.now().toString(),
          ...reflectionData,
        },
        ...state.reflections,
      ],
    })),

  refreshReflections: async () => {
    // For now, just reset to mock data
    // In the future, this would fetch from an API/database
    set({ reflections: mockReflections });
  },
})); 