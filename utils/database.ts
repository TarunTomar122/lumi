import SQLite from 'react-native-sqlite-storage';

// Enable debugging in development
SQLite.DEBUG(true);
// Use the new WebSQL API
SQLite.enablePromise(true);

export interface Task {
  id?: number;
  title: string;
  description?: string | null;
  category: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface LocalReminder {
  id?: number;
  title: string;
  description?: string | null;
  notification_time: string;
  created_at: string;
  notification_id?: string; // The ID returned by notifee
  is_sent: boolean;
}

class DatabaseManager {
  private database: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseManager;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async init(): Promise<void> {
    try {
      const db = await SQLite.openDatabase({
        name: 'lumiDB.db',
        location: 'default',
      });
      this.database = db;
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    // Create tasks table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL
      );
    `);

    // Create reminders table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        notification_time TEXT NOT NULL,
        created_at TEXT NOT NULL,
        notification_id TEXT,
        is_sent INTEGER DEFAULT 0
      );
    `);
  }

  // Tasks CRUD operations
  async getAllTasks(): Promise<Task[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [results] = await this.database.executeSql(
        'SELECT * FROM tasks ORDER BY due_date ASC;'
      );
      const tasks: Task[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        tasks.push(results.rows.item(i));
      }
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  async addTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const created_at = new Date().toISOString();
      const [result] = await this.database.executeSql(
        `INSERT INTO tasks (title, description, category, status, created_at, due_date, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [task.title, task.description, task.category, task.status, created_at, task.due_date, task.priority]
      );

      return {
        id: result.insertId,
        ...task,
        created_at,
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    try {
      await this.database.executeSql(
        `UPDATE tasks SET ${updateFields} WHERE id = ?;`,
        [...values, id]
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql('DELETE FROM tasks WHERE id = ?;', [id]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Reminders CRUD operations
  async getAllReminders(): Promise<LocalReminder[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [results] = await this.database.executeSql(
        'SELECT * FROM reminders ORDER BY notification_time ASC;'
      );
      const reminders: LocalReminder[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        reminders.push(results.rows.item(i));
      }
      return reminders;
    } catch (error) {
      console.error('Error getting reminders:', error);
      throw error;
    }
  }

  async addReminder(reminder: Omit<LocalReminder, 'id' | 'created_at' | 'is_sent'>): Promise<LocalReminder> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const created_at = new Date().toISOString();
      const [result] = await this.database.executeSql(
        `INSERT INTO reminders (title, description, notification_time, created_at, notification_id, is_sent)
         VALUES (?, ?, ?, ?, ?, 0);`,
        [reminder.title, reminder.description, reminder.notification_time, created_at, reminder.notification_id]
      );

      return {
        id: result.insertId,
        ...reminder,
        created_at,
        is_sent: false,
      };
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  async updateReminder(id: number, updates: Partial<Omit<LocalReminder, 'id' | 'created_at'>>): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    try {
      await this.database.executeSql(
        `UPDATE reminders SET ${updateFields} WHERE id = ?;`,
        [...values, id]
      );
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql('DELETE FROM reminders WHERE id = ?;', [id]);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  async markReminderAsSent(id: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE reminders SET is_sent = 1 WHERE id = ?;',
        [id]
      );
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }
  }
}

export const db = DatabaseManager.getInstance(); 