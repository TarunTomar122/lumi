import { create } from 'zustand';
import { clientTools } from '@/utils/tools';
import type { Task } from '@/utils/database';

interface TaskWithType extends Task {
  type: 'task';
}

interface TaskState {
  tasks: TaskWithType[];
  setTasks: (tasks: TaskWithType[]) => void;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>(set => ({
  tasks: [],

  setTasks: tasks => set({ tasks }),

  addTask: async taskData => {
    const result = await clientTools.addTask(taskData);
    if (result.success && result.task) {
      set(state => ({
        tasks: [...state.tasks, { ...result.task, type: 'task' } as TaskWithType],
      }));
    }
  },

  updateTask: async (id, updates) => {
    const result = await clientTools.updateTask({ id, ...updates });
    if (result.success && result.task) {
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === id ? ({ ...result.task, type: 'task' } as TaskWithType) : task
        ),
      }));
    }
  },

  deleteTask: async id => {
    const result = await clientTools.deleteTask({ id });
    if (result.success) {
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
      }));
    }
  },

  refreshTasks: async () => {
    const result = await clientTools.getAllTasks();
    if (result.success && result.tasks) {
      const tasksWithType = result.tasks.map(task => ({
        ...task,
        type: 'task' as const,
      })) as TaskWithType[];
      set({ tasks: tasksWithType });
    }
  },
}));
