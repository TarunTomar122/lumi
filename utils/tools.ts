import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  AndroidColor,
} from '@notifee/react-native';
import { db } from '@/utils/database';
import type { Task } from '@/utils/database';
import { DateTime } from 'luxon';

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
        text: { type: 'string', description: 'Text content of the memory' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags for the memory. Should always only contain 1 tag.',
        },
      },
      required: ['title', 'text', 'tags'],
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
        text: { type: 'string', description: 'Text content of the memory' },
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
];

const clientTools = {
  getAllTasks: async () => {
    try {
      const tasks = await db.getAllTasks();
      // Filter out done tasks
      const filteredTasks = tasks.filter(task => task.status !== 'done');
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

      await db.updateTask(id, updates);
      const updatedTasks = await db.getAllTasks();
      const updatedTask = updatedTasks.find(t => t.id === id);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task.' };
    }
  },

  addMemory: async ({ title, text, tags }: { title: string; text: string; tags: string[] }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          text,
          tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create memory');
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error adding memory:', error);
      return { success: false, error: 'Failed to add memory.' };
    }
  },

  deleteMemory: async ({ id }: { id: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/memories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete memory');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return { success: false, error: 'Failed to delete memory.' };
    }
  },

  getAllMemories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/memories`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch memories');
      }

      const data = await response.json();
      return { success: true, memories: data.memories, totalResults: data.totalResults };
    } catch (error) {
      console.error('Error fetching memories:', error);
      return { success: false, error: 'Failed to fetch memories.' };
    }
  },

  updateMemory: async ({
    id,
    title,
    text,
    tags,
  }: {
    id: string;
    title?: string;
    text?: string;
    tags?: string[];
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/memories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          text,
          tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update memory');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating memory:', error);
      return { success: false, error: 'Failed to update memory.' };
    }
  },

  searchMemories: async ({ q }: { q: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/memories/search?q=${encodeURIComponent(q)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search memories');
      }

      const data = await response.json();
      return { success: true, memories: data.memories, totalResults: data.totalResults };
    } catch (error) {
      console.error('Error searching memories:', error);
      return { success: false, error: 'Failed to search memories.' };
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

      // Create notification channel for Android with more explicit settings
      await notifee.createChannel({
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

      // Set up foreground handler for trigger notifications
      notifee.onForegroundEvent(async ({ type, detail }) => {
        const { notification, pressAction } = detail;
        console.log('🔔 Foreground event received:', type, detail);
      });

      // Set up background handler for trigger notifications
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        const { notification, pressAction } = detail;

        console.log('🔔 Background event received:', type, detail);

        // Handle the trigger event
        if (type === 7) {
          if (notification) {
            await notifee.displayNotification(notification);
          }
        }

        // Handle notification press
        if (type === 3 && pressAction) {
          console.log('Notification pressed:', pressAction.id);
        }
      });
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

    const channelId = await notifee.createChannel({
      id: 'reminder',
      name: 'Reminder Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [300, 500, 300, 500],
      lights: true,
      lightColor: AndroidColor.YELLOW,
      bypassDnd: true,
      vibration: true,
    });

    console.log('📅 Channel ID:', channelId);

    // Create the notification
    const notificationId = await notifee.createTriggerNotification(
      {
        id: Date.now().toString(),
        title,
        body: body || undefined,
        android: {
          channelId: channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          lights: [AndroidColor.YELLOW, 300, 500],
          smallIcon: 'ic_launcher',
          showTimestamp: true,
          ongoing: false,
          asForegroundService: true,
          autoCancel: false,
          timestamp: date.getTime(),
          fullScreenAction: {
            id: 'default',
          },
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
