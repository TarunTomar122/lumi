import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/remindersStyles';
import { clientTools } from '@/utils/tools';
import { Task } from '@/utils/database';
import TaskEditModal from '../components/TaskEditModal';

export default function RemindersScreen() {
  const navigation = useNavigation();
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
        console.log('All tasks:', JSON.stringify(result.tasks, null, 2));
        // Filter tasks that have reminders
        const tasksWithReminders = result.tasks.filter(task => {
          console.log('Checking task for reminder:', task.title, 'reminder_time:', task.reminder_time);
          return task.reminder_time !== null && task.reminder_time !== undefined;
        });
        console.log('Tasks with reminders:', JSON.stringify(tasksWithReminders, null, 2));
        setTasks(tasksWithReminders);
      } else {
        setError('Failed to load reminders');
      }
    } catch (err) {
      setError('Error loading reminders');
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

  const validateReminderTime = (reminderTime: string | null | undefined): boolean => {
    if (!reminderTime) return true;
    const now = new Date();
    const reminderDate = new Date(reminderTime);
    return reminderDate > now;
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // Validate reminder time if present
      if (updates.reminder_time && !validateReminderTime(updates.reminder_time)) {
        setError('Reminder time must be in the future');
        return;
      }

      const result = await clientTools.updateTask({ id: taskId, ...updates });
      if (result.success) {
        setError(null); // Clear any existing errors
        await loadTasks();
      } else {
        setError('Failed to update reminder');
      }
    } catch (err) {
      console.error('Error updating reminder:', err);
      if (err instanceof Error && err.message.includes('must be in the future')) {
        setError('Reminder time must be in the future');
      } else {
        setError('Error updating reminder');
      }
    }
  };

  const handleRemoveReminder = async (taskId: number) => {
    try {
      const result = await clientTools.updateTask({ 
        id: taskId, 
        reminder_time: null,
        notification_id: null 
      });
      if (result.success) {
        setError(null); // Clear any existing errors
        await loadTasks();
      } else {
        setError('Failed to remove reminder');
      }
    } catch (err) {
      console.error('Error removing reminder:', err);
      setError('Error removing reminder');
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#4CAF50';
      default:
        return '#FFA726';
    }
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffHours = Math.round((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `in ${diffDays} days`;
    }
  };

  const renderReminder = ({ item }: { item: Task }) => {
    if (!item.id || !item.reminder_time) return null;
    return (
      <Pressable style={styles.taskItem} onPress={() => setEditingTask(item)}>
        <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.taskContent}>
          <View style={styles.taskMain}>
            <View>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.taskMeta}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.reminderText}>
                  Reminder {getRelativeTime(item.reminder_time)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveReminder(item.id!)}>
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };

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
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Reminders</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tasks}
        renderItem={renderReminder}
        keyExtractor={item => (item.id || Date.now()).toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No reminders yet</Text>
            <Text style={styles.emptySubText}>
              Add reminders to tasks by editing them and enabling the reminder option
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#333"
            colors={['#333']}
          />
        }
      />
      {editingTask && (
        <TaskEditModal
          visible={true}
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            setError(null); // Clear any errors when closing modal
          }}
          onSave={updates => {
            if (editingTask.id !== undefined) {
              handleUpdateTask(editingTask.id, updates);
            }
            setEditingTask(null);
          }}
          onDelete={async (taskId) => {
            try {
              const result = await clientTools.deleteTask({ id: taskId });
              if (result.success) {
                setError(null);
                await loadTasks();
              } else {
                setError('Failed to delete reminder');
              }
            } catch (err) {
              console.error('Error deleting reminder:', err);
              setError('Error deleting reminder');
            }
          }}
        />
      )}
    </View>
  );
}
