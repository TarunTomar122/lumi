import { create } from 'zustand';
import { clientTools } from '@/utils/tools';

export interface Memory {
  id: string;
  title: string;
  text: string;
  date: string;
  tags: string[];
  type: 'memory';
}

interface MemoryState {
  memories: Memory[];
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Omit<Memory, 'id' | 'date' | 'type'>) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Omit<Memory, 'id' | 'type'>>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  refreshMemories: () => Promise<void>;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  
  setMemories: (memories) => set({ memories }),
  
  addMemory: async (memoryData) => {
    const result = await clientTools.addMemory(memoryData);
    if (result.success && result.id) {
      const newMemory = {
        id: result.id,
        ...memoryData,
        date: new Date().toISOString(),
        type: 'memory' as const
      };
      set((state) => ({
        memories: [...state.memories, newMemory]
      }));
    }
  },
  
  updateMemory: async (id, updates) => {
    const result = await clientTools.updateMemory({ id, ...updates });
    if (result.success) {
      set((state) => ({
        memories: state.memories.map(memory => 
          memory.id === id 
            ? { ...memory, ...updates, date: new Date().toISOString() }
            : memory
        )
      }));
    }
  },
  
  deleteMemory: async (id) => {
    const result = await clientTools.deleteMemory({ id });
    if (result.success) {
      set((state) => ({
        memories: state.memories.filter(memory => memory.id !== id)
      }));
    }
  },
  
  refreshMemories: async () => {
    const result = await clientTools.getAllMemories();
    if (result.success && result.memories) {
      const memoriesWithType = result.memories.map((memory: { id: string; title: string; text: string; date: string; tags: string[] }) => ({ 
        ...memory, 
        type: 'memory' as const 
      }));
      set({ memories: memoriesWithType });
    }
  }
})); 