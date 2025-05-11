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
  type: 'memory' | 'task';
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

  const handleDelete = async (id: string | number, type: 'memory' | 'task') => {
    try {
      if (type === 'memory') {
        await clientTools.deleteMemory({ id: id as string });
      } else if (type === 'task') {
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
            <View key={index} style={[styles.itemContainer]}>
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
                          size={32}
                          color="#000000"
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item.id!, item.type as 'memory' | 'task')}>
                        <Ionicons name="trash-outline" size={32} color="#000000" />
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
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  text: {
    fontSize: 18,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
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
