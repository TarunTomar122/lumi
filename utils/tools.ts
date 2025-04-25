import { supabase } from './supabase';
import { getBusySlots } from './calendar';

// Define the database schema types
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task; // what you get back from the db
        Insert: Omit<Task, 'id' | 'created_at'>; // what you can insert
        Update: Partial<Omit<Task, 'id' | 'created_at'>>; // what you can update
      };
    };
  };
};

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string; // will be handled by Supabase
  due_date: string;
  priority: 'low' | 'medium' | 'high';
}

const clientToolsSchema = [
  {
    type: 'function',
    name: 'getAllTasks',
    description: 'Gets all tasks from the database.',
  },
  {
    type: 'function',
    name: 'addTask',
    description: 'Adds a task to the database.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        category: { type: 'string', description: 'Category of the task' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Status of the task',
        },
        due_date: { type: 'string', description: 'Due date in ISO format' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority of the task',
        },
      },
      required: ['title', 'category', 'status', 'due_date', 'priority'],
    },
  },
  {
    type: 'function',
    name: 'deleteTask',
    description: 'Deletes a task from the database.',
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
    description: 'Updates a task in the database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the task to update' },
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        category: { type: 'string', description: 'Category of the task' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Status of the task',
        },
        due_date: { type: 'string', description: 'Due date in ISO format' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority of the task',
        },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'getBusySlots',
    description:
      'Gets the busy slots for the current user from their Google Calendar for a given date.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in ISO format (e.g. "2024-04-25")',
        },
      },
      required: ['date'],
    },
  },
];

const clientTools = {
  getAllTasks: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: 'Failed to fetch tasks.' };
    }
    return { success: true, tasks: data };
  },

  addTask: async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('tasks').insert(taskData).select().single();

    if (error) {
      console.error('Error adding task:', error);
      return { success: false, error: 'Failed to add task.' };
    }
    return { success: true, task: data };
  },

  deleteTask: async ({ id }: { id: number }) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: 'Failed to delete task.' };
    }
    return { success: true };
  },

  updateTask: async ({
    id,
    ...updates
  }: { id: number } & Partial<Omit<Task, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task.' };
    }
    return { success: true, task: data };
  },
  getBusySlots: async (rangeData: { date: string }) => {
    console.log('Getting busy slots for date:', rangeData.date);
    const busySlots = await getBusySlots(rangeData.date);
    return { success: true, busySlots };
  },
};

export { clientTools, clientToolsSchema };

// Test function to verify all operations
export const testDatabaseOperations = async () => {
  console.log('🧪 Starting database operations test...');

  try {
    // Test 1: Add a task
    console.log('\n1️⃣ Testing addTask...');
    const newTask = {
      title: 'Test Task',
      description: 'This is a test task',
      category: 'test',
      status: 'todo' as const,
      due_date: new Date().toISOString(),
      priority: 'medium' as const,
    };

    const addResult = await clientTools.addTask(newTask);
    console.log('Add Result:', addResult);
    if (!addResult.success || !addResult.task) {
      throw new Error('Failed to add task');
    }
    const taskId = addResult.task.id;
    console.log('✅ Add task successful!');

    // Test 2: Get all tasks
    console.log('\n2️⃣ Testing getAllTasks...');
    const getAllResult = await clientTools.getAllTasks();
    console.log('Get All Result:', getAllResult);
    if (!getAllResult.success || !getAllResult.tasks) {
      throw new Error('Failed to get tasks');
    }
    console.log('✅ Get all tasks successful!');

    // Test 3: Update task
    console.log('\n3️⃣ Testing updateTask...');
    const updateResult = await clientTools.updateTask({
      id: taskId,
      title: 'Updated Test Task',
      status: 'in_progress' as const,
    });
    console.log('Update Result:', updateResult);
    if (!updateResult.success) {
      throw new Error('Failed to update task');
    }
    console.log('✅ Update task successful!');

    // Test 4: Delete task
    console.log('\n4️⃣ Testing deleteTask...');
    const deleteResult = await clientTools.deleteTask({ id: taskId });
    console.log('Delete Result:', deleteResult);
    if (!deleteResult.success) {
      throw new Error('Failed to delete task');
    }
    console.log('✅ Delete task successful!');

    console.log('\n🎉 All database operations tested successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};
