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
  reminder_time?: string | null;
  notification_id?: string | null;
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

  async reinitialize(): Promise<void> {
    try {
      // Close existing connection if any
      if (this.database) {
        await this.database.close();
        this.database = null;
      }
      // Initialize again
      await this.init();
      console.log('Database reinitialized successfully');
    } catch (error) {
      console.error('Error reinitializing database:', error);
      throw error;
    }
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

    try {
      // Create tasks table with basic fields
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

      // Check if reminder_time column exists
      const [result] = await this.database.executeSql(`
        SELECT name FROM pragma_table_info('tasks') WHERE name='reminder_time';
      `);

      // Add new columns if they don't exist
      if (result.rows.length === 0) {
        await this.database.executeSql(`
          ALTER TABLE tasks ADD COLUMN reminder_time TEXT;
        `);
        await this.database.executeSql(`
          ALTER TABLE tasks ADD COLUMN notification_id TEXT;
        `);
        console.log('Added reminder columns to tasks table');
      }
    } catch (error) {
      console.error('Error in createTables:', error);
      throw error;
    }
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
        `INSERT INTO tasks (title, description, category, status, created_at, due_date, priority, reminder_time, notification_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          task.title,
          task.description,
          task.category,
          task.status,
          created_at,
          task.due_date,
          task.priority,
          task.reminder_time || null,
          task.notification_id || null
        ]
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
}

export const db = DatabaseManager.getInstance(); 