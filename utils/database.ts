import SQLite from 'react-native-sqlite-storage';

// Enable debugging in development
SQLite.DEBUG(true);
// Use the new WebSQL API
SQLite.enablePromise(true);

export interface Task {
  id?: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  reminder_date?: string | null; // Will store full datetime string
  status: 'todo' | 'done';
}

export interface Memory {
  id?: number;
  title: string;
  description?: string | null;
  date: string;
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
    return;
    try {
      // Drop existing table if it exists
      await this.database.executeSql('DROP TABLE IF EXISTS tasks;');
      await this.database.executeSql('DROP TABLE IF EXISTS memories;');

      // Create new simplified table with updated schema
      await this.database.executeSql(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          due_date TEXT,
          reminder_date TEXT,
          status TEXT NOT NULL DEFAULT 'todo'
        );
      `);

      // Create another table to store memories
      await this.database.executeSql(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          tag TEXT,
          date TEXT NOT NULL
        );
      `);

      console.log('Tables created successfully');
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
        'SELECT * FROM tasks ORDER BY COALESCE(due_date, reminder_date, datetime("now")) ASC;'
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

  async addTask(task: Omit<Task, 'id'>): Promise<Task> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        `INSERT INTO tasks (title, description, due_date, reminder_date, status)
         VALUES (?, ?, ?, ?, ?);`,
        [
          task.title,
          task.description || null,
          task.due_date || null,
          task.reminder_date || null,
          task.status || 'todo',
        ]
      );

      return {
        id: result.insertId,
        ...task,
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    try {
      await this.database.executeSql(`UPDATE tasks SET ${updateFields} WHERE id = ?;`, [
        ...values,
        id,
      ]);
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

  // Memories CRUD operations
  async getAllMemories(): Promise<Memory[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [results] = await this.database.executeSql(
        'SELECT * FROM memories ORDER BY date DESC;'
      );
      const memories: Memory[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        memories.push(results.rows.item(i));
      }
      return memories;
    } catch (error) {
      console.error('Error getting memories:', error);
      throw error;
    }
  }

  async addMemory(memory: Omit<Memory, 'id'>): Promise<Memory> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        `INSERT INTO memories (title, description, date) VALUES (?, ?, ?);`,
        [memory.title, memory.description || null, memory.date]
      );

      return {
        id: result.insertId,
        ...memory,
      };
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  }

  async deleteMemory(id: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql('DELETE FROM memories WHERE id = ?;', [id]);
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  }

  async updateMemory(id: number, updates: Partial<Omit<Memory, 'id'>>): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    try {
      await this.database.executeSql(`UPDATE memories SET ${updateFields} WHERE id = ?;`, [
        ...values,
        id,
      ]);
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  }
}

export const db = DatabaseManager.getInstance();
