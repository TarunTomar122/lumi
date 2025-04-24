import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Pressable, RefreshControl } from 'react-native';
import { clientTools } from '@/utils/tools';
import { Task } from '@/utils/tools';
import { Ionicons } from '@expo/vector-icons';
import TaskEditModal from '../components/TaskEditModal';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const result = await clientTools.getAllTasks();
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError('Error loading tasks');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const result = await clientTools.updateTask({ id: taskId, ...updates });
      if (result.success) {
        await loadTasks();
      } else {
        setError('Failed to update task');
      }
    } catch (err) {
      setError('Error updating task');
      console.error(err);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const formatDueDate = (date: string) => {
    const today = new Date();
    const dueDate = new Date(date);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) {
      return `${dueDate.getHours()}:${dueDate.getMinutes().toString().padStart(2, '0')} AM`;
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      const result = await clientTools.addTask({
        title: taskData.title || '',
        description: taskData.description || null,
        category: taskData.category || 'Personal',
        status: taskData.status || 'todo',
        due_date: taskData.due_date || new Date().toISOString(),
        priority: taskData.priority || 'medium',
      });
      
      if (result.success) {
        await loadTasks();
      } else {
        setError('Failed to add task');
      }
    } catch (err) {
      setError('Error adding task');
      console.error(err);
    }
  };

  const createNewTask = (): Task => ({
    id: -1, // Temporary ID for new task
    title: '',
    description: null,
    category: 'Personal',
    status: 'todo',
    created_at: new Date().toISOString(),
    due_date: new Date().toISOString(),
    priority: 'medium',
  });

  const renderTask = ({ item }: { item: Task }) => (
    <Pressable 
      style={styles.taskItem}
      onPress={() => setEditingTask(item)}>
      <View style={styles.taskLeft}>
        <TouchableOpacity
          style={[styles.checkbox, item.status === 'done' && styles.checkboxChecked]}
          onPress={() => handleToggleStatus(item)}>
          {item.status === 'done' && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </TouchableOpacity>
        <View>
          <Text style={[
            styles.taskTitle,
            item.status === 'done' && styles.taskTitleDone
          ]}>
            {item.title}
          </Text>
          {item.due_date && (
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateText}>{formatDueDate(item.due_date)}</Text>
              {item.status === 'in_progress' && (
                <Ionicons name="sync-outline" size={14} color="#666" style={styles.recurringIcon} />
              )}
            </View>
          )}
        </View>
      </View>
      <View style={styles.taskRight}>
        <Text style={[
          styles.categoryTag,
          { backgroundColor: item.category === 'Work' ? '#E8F0FE' : '#F3E8FD' }
        ]}>
          {item.category} #
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Today</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks for today</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a73e8"
            colors={['#1a73e8']}
          />
        }
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setEditingTask(createNewTask())}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      {editingTask && (
        <TaskEditModal
          visible={true}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updates => {
            if (editingTask.id === -1) {
              handleAddTask(updates);
            } else {
              handleUpdateTask(editingTask.id, updates);
            }
            setEditingTask(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '400',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1a73e8',
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  taskTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recurringIcon: {
    marginLeft: 4,
  },
  taskRight: {
    marginLeft: 16,
  },
  categoryTag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DB4437',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 24,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#DB4437',
    marginTop: 24,
  },
});
