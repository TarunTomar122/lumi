import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientTools } from '@/utils/tools';
import { useRouter } from 'expo-router';
import { formatDate } from '@/utils/commons';
export type InfoMessageType = 'info' | 'success' | 'error' | 'warning';

export interface InfoMessageItem {
  title: string;
  text: string;
  type: 'memory' | 'task' | 'reminder';
  icon?: string;
  id?: string | number;
  status?: 'todo' | 'done';
  due_date?: string;
  reminder_date?: string;
  date?: string;
}

export interface InfoMessageProps {
  items: InfoMessageItem[];
}

const InfoContainer: React.FC<InfoMessageProps> = ({ items }) => {
  const router = useRouter();
  // Keep track of task statuses with a Map to store both completed and uncompleted states
  const [taskStatuses, setTaskStatuses] = useState<Map<string | number, 'done' | 'todo'>>(
    new Map()
  );
  // Keep track of deleted items to filter them out from the UI
  const [deletedItems, setDeletedItems] = useState<Set<string | number>>(new Set());

  const handleTaskToggle = async (id: number, currentStatus: 'todo' | 'done' = 'todo') => {
    try {
      // Determine the new status
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';

      await clientTools.updateTask({
        id,
        status: newStatus,
      });

      // Update UI immediately
      setTaskStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(id, newStatus);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (id: string | number, type: 'memory' | 'reminder') => {
    try {
      if (type === 'memory') {
        await clientTools.deleteMemory({ id: id as string });
      } else if (type === 'reminder') {
        await clientTools.deleteTask({ id: id as number });
      }

      // Update UI immediately
      setDeletedItems(prev => new Set([...prev, id]));
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  return (
    <View style={styles.container}>
      {items
        .filter(item => !deletedItems.has(item.id!))
        .map((item, index) => {
          // Check both the original status and our local state
          const currentStatus =
            item.type === 'task' ? taskStatuses.get(item.id!) || item.status : undefined;
          const isCompleted = item.type === 'task' && item.id ? currentStatus === 'done' : false;

          return (
            <View
              key={index}
              style={[styles.itemContainer, { backgroundColor: 'rgba(213, 213, 213, 0)' }]}>
              <View style={styles.contentContainer}>
                {item.type === 'memory' ? (
                  <TouchableOpacity
                    style={styles.textContainer}
                    onPress={() => {
                      router.push({
                        pathname: '/details',
                        params: { item: JSON.stringify(item) },
                      });
                    }}>
                    <Text style={[styles.text, isCompleted && styles.completedText]}>
                      {item.title ? `${item.title} ` : ''}
                    </Text>
                    {(item.due_date || item.reminder_date) && (
                      <View style={styles.dateContainer}>
                        {item.due_date && (
                          <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                            <Ionicons name="calendar-outline" size={14} /> Due:{' '}
                            {formatDate(item.due_date)}
                          </Text>
                        )}
                        {item.reminder_date && (
                          <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                            <Ionicons name="alarm-outline" size={14} /> Reminder:{' '}
                            {formatDate(item.reminder_date)}
                          </Text>
                        )}
                        {item.date && (
                          <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                            <Ionicons name="calendar-outline" size={14} /> Date:{' '}
                            {formatDate(item.date)}
                          </Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.textContainer}>
                    <Text style={[styles.text, isCompleted && styles.completedText]}>
                      {item.title ? `${item.title} ` : ''}
                    </Text>
                    {(item.due_date || item.reminder_date) && (
                      <View style={styles.dateContainer}>
                        {item.due_date && (
                          <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                            <Ionicons name="calendar-outline" size={14} /> Due:{' '}
                            {formatDate(item.due_date)}
                          </Text>
                        )}
                        {item.reminder_date && (
                          <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                            <Ionicons name="alarm-outline" size={14} /> Reminder:{' '}
                            {formatDate(item.reminder_date)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
                {item.id && (
                  <View style={styles.actionsContainer}>
                    {item.type === 'task' ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          handleTaskToggle(item.id as number, currentStatus as 'todo' | 'done')
                        }>
                        <Ionicons
                          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color="#F5F5F5"
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item.id!, item.type as 'memory' | 'reminder')}>
                        <Ionicons name="trash-outline" size={20} color="#F5F5F5" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#4B4B4B',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  text: {
    color: '#F5F5F5',
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    marginBottom: 4,
    lineHeight: 24,
  },
  dateContainer: {
    marginTop: 8,
  },
  dateText: {
    color: '#A1887F',
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionsContainer: {
    marginLeft: 12,
  },
  actionButton: {
    // backgroundColor: '#4B4B4B',
    borderRadius: 12,
    padding: 8,
  },
});

export default InfoContainer;
