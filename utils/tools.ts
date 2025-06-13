import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  AndroidColor,
} from '@notifee/react-native';
import { db } from '@/utils/database';
import type { Task, Memory, Habit } from '@/utils/database';
import { DateTime } from 'luxon';
import { checkUsagePermission, getLastDayUsageStats } from '@/utils/usageStats';
import { useHabitStore } from '@/app/store/habitStore';
// const API_BASE_URL = 'http://10.161.88.145:3001/api';
const API_BASE_URL = 'https://lumi-server-iixq.onrender.com/api';

const clientToolsSchema = [
  {
    type: 'function',
    name: 'getAllTasks',
    description: 'Gets all tasks from the local database.',
  },
  {
    type: 'function',
    name: 'getReminders',
    description: 'Gets all reminders from the local database.',
  },
  {
    type: 'function',
    name: 'addTask',
    description: 'Adds a task to the local database.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        due_date: {
          type: 'string',
          description: 'Optional due date in ISO format',
        },
        reminder_date: {
          type: 'string',
          description: 'Optional reminder datetime in ISO format',
        },
        status: {
          type: 'string',
          enum: ['todo', 'done'],
          description: 'Status of the task',
        },
      },
      required: ['title'],
    },
  },
  {
    type: 'function',
    name: 'deleteTask',
    description: 'Deletes a task from the local database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the task to delete' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'updateTask',
    description: 'Updates a task in the local database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the task to update' },
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        due_date: {
          type: 'string',
          description: 'Optional due date in ISO format',
        },
        reminder_date: {
          type: 'string',
          description: 'Optional reminder datetime in ISO format',
        },
        status: {
          type: 'string',
          enum: ['todo', 'done'],
          description: 'Status of the task',
        },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'addMemory',
    description: 'Adds a memory to the weaviate database.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the memory' },
        content: { type: 'string', description: 'Content of the memory' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags for the memory. Should always only contain 1 tag.',
        },
      },
      required: ['title', 'content', 'tags'],
    },
  },
  {
    type: 'function',
    name: 'deleteMemory',
    description: 'Deletes a memory from the weaviate database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the memory to delete' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'getAllMemories',
    description: 'Gets all memories from the weaviate database.',
  },
  {
    type: 'function',
    name: 'updateMemory',
    description: 'Updates a memory in the weaviate database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the memory to update' },
        title: { type: 'string', description: 'Title of the memory' },
        content: { type: 'string', description: 'Content of the memory' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags for the memory',
        },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'searchMemories',
    description: 'Searches memories in the weaviate database.',
    parameters: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Query to search for memories' },
      },
      required: ['q'],
    },
  },
  {
    type: 'function',
    name: 'getUsageStats',
    description: 'Gets the usage stats of different apps on the device.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    type: 'function',
    name: 'addHabit',
    description: 'Adds a new habit to track.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the habit' },
        color: {
          type: 'string',
          description:
            'Optional hex color code for the habit. If not provided, a random pastel color will be assigned.',
        },
      },
      required: ['title'],
    },
  },
  {
    type: 'function',
    name: 'deleteHabit',
    description: 'Deletes a habit.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the habit to delete' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'updateHabit',
    description: "Updates a habit's properties.",
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the habit to update' },
        title: { type: 'string', description: 'New title for the habit' },
        color: { type: 'string', description: 'New hex color code for the habit' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'getAllHabits',
    description: 'Gets all habits.',
  },
  {
    type: 'function',
    name: 'getAllReflections',
    description: 'Gets all reflections from the database.',
  },
  {
    type: 'function',
    name: 'addReflection',
    description: 'Adds a new reflection.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date of the reflection in ISO format' },
        content: { type: 'string', description: 'Content of the reflection' },
      },
      required: ['date', 'content'],
    },
  },
  {
    type: 'function',
    name: 'updateReflection',
    description: 'Updates a reflection.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the reflection to update' },
        date: { type: 'string', description: 'New date for the reflection' },
        content: { type: 'string', description: 'New content for the reflection' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'deleteReflection',
    description: 'Deletes a reflection.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the reflection to delete' },
      },
      required: ['id'],
    },
  },
];

const clientTools = {
  getAllTasks: async () => {
    try {
      const tasks = await db.getAllTasks();
      // Show ALL uncompleted tasks (regardless of date)
      // Only hide completed tasks from yesterday or before
      const today = DateTime.now().setZone('Asia/Kolkata').startOf('day');
      
      const filteredTasks = tasks.filter(task => {
        // Always show uncompleted tasks
        if (task.status !== 'done') {
          return true;
        }
        
        // For completed tasks, hide them if they have no due_date or reminder_date
        if (!task.due_date && !task.reminder_date) {
          return false;
        }
        
        // Check the task date (use due_date if available, otherwise reminder_date)
        const taskDateStr = task.due_date || task.reminder_date;
        if (!taskDateStr) return false;
        
        const taskDate = DateTime.fromISO(taskDateStr).setZone('Asia/Kolkata').startOf('day');
        
        // Show completed tasks only if they're from today or future
        return taskDate >= today;
      });
      
      return { success: true, tasks: filteredTasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: 'Failed to fetch tasks.' };
    }
  },
  getReminders: async () => {
    const tasks = await db.getAllTasks();
    // filter out past reminders
    const reminders = tasks.filter(
      task =>
        task.reminder_date &&
        DateTime.fromISO(task.reminder_date).setZone('Asia/Kolkata').diffNow().toMillis() > 0
    );
    return { success: true, reminders };
  },
  addTask: async (taskData: Omit<Task, 'id'>) => {
    try {
      let notificationId = null;
      if (taskData.reminder_date) {
        const dt = DateTime.fromISO(taskData.reminder_date).setZone('Asia/Kolkata');
        console.log('📅 scheduling notification for:', dt);
        notificationId = await scheduleNotification(
          taskData.title,
          taskData.description || null,
          dt
        );
      }

      const task = await db.addTask(taskData);
      return { success: true, task };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error: 'Failed to add task.' };
    }
  },

  deleteTask: async ({ id }: { id: number }) => {
    try {
      // Get the task to check if it has a notification
      const tasks = await db.getAllTasks();
      const task = tasks.find(t => t.id === id);

      if (task?.reminder_date) {
        // Cancel any scheduled notification
        const notificationId = await notifee.getTriggerNotificationIds();
        for (const nId of notificationId) {
          await notifee.cancelTriggerNotification(nId);
        }
      }

      await db.deleteTask(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: 'Failed to delete task.' };
    }
  },

  updateTask: async ({ id, ...updates }: { id: number } & Partial<Omit<Task, 'id'>>) => {
    try {
      // Get the current task to check for notification changes
      const tasks = await db.getAllTasks();
      const task = tasks.find(t => t.id === id);

      // Handle notification updates
      if (updates.reminder_date !== undefined) {
        // Cancel existing notifications for this task
        const notificationIds = await notifee.getTriggerNotificationIds();
        for (const nId of notificationIds) {
          await notifee.cancelTriggerNotification(nId);
        }

        // Schedule new notification if reminder_date is provided
        if (updates.reminder_date) {
          await scheduleNotification(
            updates.title || task?.title || '',
            updates.description || task?.description || null,
            DateTime.fromISO(updates.reminder_date).setZone('Asia/Kolkata')
          );
        }
      }

      // Cancel notifications when task is marked as completed
      if (updates.status === 'done' && task?.reminder_date) {
        const notificationIds = await notifee.getTriggerNotificationIds();
        for (const nId of notificationIds) {
          await notifee.cancelTriggerNotification(nId);
        }
        console.log('📱 Cancelled notification for completed task:', task.title);
      }

      // Re-schedule notification when task is marked as todo again (if it has a future reminder)
      if (updates.status === 'todo' && task?.reminder_date) {
        const reminderTime = DateTime.fromISO(task.reminder_date).setZone('Asia/Kolkata');
        // Only re-schedule if the reminder is in the future
        if (reminderTime > DateTime.now().setZone('Asia/Kolkata')) {
          await scheduleNotification(
            task.title,
            task.description || null,
            reminderTime
          );
          console.log('📱 Re-scheduled notification for uncompleted task:', task.title);
        }
      }

      await db.updateTask(id, updates);
      const updatedTasks = await db.getAllTasks();
      const updatedTask = updatedTasks.find(t => t.id === id);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task.' };
    }
  },

  addMemory: async ({
    title,
    content,
    tags,
  }: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const memory = await db.addMemory({
        title,
        content,
        date: new Date().toISOString(),
        tags,
      });
      return { success: true, id: memory.id };
    } catch (error) {
      console.error('Error adding memory:', error);
      return { success: false, error: 'Failed to add memory.' };
    }
  },

  deleteMemory: async ({ id }: { id: string }) => {
    try {
      await db.deleteMemory(Number(id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return { success: false, error: 'Failed to delete memory.' };
    }
  },

  getAllMemories: async () => {
    try {
      const memories = await db.getAllMemories();
      return { success: true, memories, totalResults: memories.length };
    } catch (error) {
      console.error('Error fetching memories:', error);
      return { success: false, error: 'Failed to fetch memories.' };
    }
  },

  updateMemory: async ({
    id,
    title,
    content,
    tags,
  }: {
    id: string;
    title?: string;
    content?: string;
    tags?: string[];
  }) => {
    try {
      await db.updateMemory(Number(id), {
        title,
        content,
        tags,
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating memory:', error);
      return { success: false, error: 'Failed to update memory.' };
    }
  },

  searchMemories: async ({ q }: { q: string }) => {
    try {
      // For now, we'll do a simple title/content search in the local database
      // In the future, we can implement more sophisticated search if needed
      const allMemories = await db.getAllMemories();
      const searchTerm = q.toLowerCase();
      const memories = allMemories.filter(
        memory =>
          memory.title.toLowerCase().includes(searchTerm) ||
          memory.content.toLowerCase().includes(searchTerm) ||
          memory.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
      return { success: true, memories, totalResults: memories.length };
    } catch (error) {
      console.error('Error searching memories:', error);
      return { success: false, error: 'Failed to search memories.' };
    }
  },
  getUsageStats: async () => {
    const permission = await checkUsagePermission();
    console.log('Permission:', permission);
    if (!permission) {
      console.log('No permission to get usage stats');
      return { success: false, error: 'Failed to get usage stats.' };
    }
    const appUsageStats = await getLastDayUsageStats();
    return { success: true, appUsageStats };
  },
  addHabit: async ({ title, color }: { title: string; color?: string }) => {
    try {
      const habit = await db.addHabit({
        title,
        completions: {},
        color: color || '#FFB3BA', // Default to first pastel color if none provided
      });
      return { success: true, id: habit.id };
    } catch (error) {
      console.error('Error adding habit:', error);
      return { success: false, error: 'Failed to add habit.' };
    }
  },

  deleteHabit: async ({ id }: { id: string }) => {
    try {
      await db.deleteHabit(Number(id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { success: false, error: 'Failed to delete habit.' };
    }
  },

  updateHabit: async ({
    id,
    title,
    color,
    completions,
  }: {
    id: string;
    title?: string;
    color?: string;
    completions?: Record<string, boolean>;
  }) => {
    try {
      await db.updateHabit(Number(id), {
        ...(title && { title }),
        ...(color && { color }),
        ...(completions && { completions }),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating habit:', error);
      return { success: false, error: 'Failed to update habit.' };
    }
  },

  getAllHabits: async () => {
    try {
      const habits = await db.getAllHabits();
      return { success: true, habits };
    } catch (error) {
      console.error('Error fetching habits:', error);
      return { success: false, error: 'Failed to fetch habits.' };
    }
  },

  getAllReflections: async () => {
    try {
      const reflections = await db.getAllReflections();
      return { success: true, reflections };
    } catch (error) {
      console.error('Error fetching reflections:', error);
      return { success: false, error: 'Failed to fetch reflections.' };
    }
  },

  addReflection: async ({ date, content }: { date: string; content: string }) => {
    try {
      const reflection = await db.addReflection({ date, content });
      return { success: true, reflection };
    } catch (error) {
      console.error('Error adding reflection:', error);
      return { success: false, error: 'Failed to add reflection.' };
    }
  },

  updateReflection: async ({
    id,
    date,
    content,
  }: {
    id: number;
    date?: string;
    content?: string;
  }) => {
    try {
      await db.updateReflection(id, {
        ...(date && { date }),
        ...(content && { content }),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating reflection:', error);
      return { success: false, error: 'Failed to update reflection.' };
    }
  },

  deleteReflection: async ({ id }: { id: number }) => {
    try {
      await db.deleteReflection(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting reflection:', error);
      return { success: false, error: 'Failed to delete reflection.' };
    }
  },
};

export { clientTools, clientToolsSchema };

// Notification setup function
export const setupNotifications = async () => {
  try {
    // Request permissions using Notifee (works for both iOS and Android)
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus) {
      console.log('✅ Notification permissions granted');

      const channelId = await notifee.createChannel({
        id: 'reminder',
        name: 'Reminder Channel',
      });

      console.log('📅 Channel ID:', channelId);
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
    throw error;
  }
};

// Schedule a local notification using notifee
export const scheduleNotification = async (
  title: string,
  body: string | null,
  scheduledTime: DateTime
): Promise<string> => {
  try {
    const date = new Date();
    date.setHours(scheduledTime.hour);
    date.setMinutes(scheduledTime.minute);
    date.setSeconds(scheduledTime.second);
    date.setDate(scheduledTime.day);
    date.setMonth(scheduledTime.month - 1);
    date.setFullYear(scheduledTime.year);

    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };
    // Create the notification
    const notificationId = await notifee.createTriggerNotification(
      {
        id: Date.now().toString(),
        title,
        body: body || '',
        android: {
          channelId: 'reminder',
        },
      },
      trigger
    );

    console.log('✅ Notification scheduled with ID:', notificationId);

    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    throw error;
  }
};

// Send an instant notification
export const sendInstantNotification = async (title: string, body: string) => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [300, 500, 300, 500],
    lights: true,
    lightColor: AndroidColor.YELLOW,
    bypassDnd: true,
    vibration: true,
  });
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
    },
  });
};
