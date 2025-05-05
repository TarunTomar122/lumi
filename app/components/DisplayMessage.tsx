import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientTools } from '@/utils/tools';

export type DisplayMessageType = 'info' | 'success' | 'error' | 'warning';

export interface DisplayMessageItem {
  text: string;
  type: 'memory' | 'task' | 'reminder';
  icon?: string;
  id?: number;
  status?: 'todo' | 'done';
  due_date?: string;
  reminder_date?: string;
}

interface DisplayMessageProps {
  items: DisplayMessageItem[];
}

const COLORS = {
  memory: '#3B3B3B',
  task: '#3B3B3B',
  reminder: '#3B3B3B',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })}`;
  }
  // Check if it's tomorrow
  else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })}`;
  }
  // Otherwise show full date
  else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  }
};

const DisplayMessage: React.FC<DisplayMessageProps> = ({ items }) => {
  // Keep track of task statuses with a Map to store both completed and uncompleted states
  const [taskStatuses, setTaskStatuses] = useState<Map<number, 'done' | 'todo'>>(new Map());
  // Keep track of deleted items to filter them out from the UI
  const [deletedItems, setDeletedItems] = useState<Set<number>>(new Set());

  const handleTaskToggle = async (id: number, currentStatus: 'todo' | 'done' = 'todo') => {
    try {
      // Determine the new status
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      
      await clientTools.updateTask({
        id,
        status: newStatus
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

  const handleDelete = async (id: number, type: 'memory' | 'reminder') => {
    try {
      if (type === 'memory') {
        await clientTools.deleteMemory({ id });
      } else if (type === 'reminder') {
        await clientTools.deleteTask({ id });
      }
      
      // Update UI immediately
      setDeletedItems(prev => new Set([...prev, id]));
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  return (
    <View style={styles.container}>
      {items.filter(item => !deletedItems.has(item.id!)).map((item, index) => {
        // Check both the original status and our local state
        const currentStatus = taskStatuses.get(item.id!) || item.status;
        const isCompleted = item.id ? currentStatus === 'done' : false;
        
        return (
          <View 
            key={index} 
            style={[
              styles.itemContainer,
              { backgroundColor: COLORS[item.type] }
            ]}
          >
            <View style={styles.contentContainer}>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.text,
                  isCompleted && styles.completedText
                ]}>
                  {item.icon ? `${item.icon} ` : ''}{item.text}
                </Text>
                {(item.due_date || item.reminder_date) && (
                  <View style={styles.dateContainer}>
                    {item.due_date && (
                      <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                        <Ionicons name="calendar-outline" size={14} /> Due: {formatDate(item.due_date)}
                      </Text>
                    )}
                    {item.reminder_date && (
                      <Text style={[styles.dateText, isCompleted && styles.completedText]}>
                        <Ionicons name="alarm-outline" size={14} /> Reminder: {formatDate(item.reminder_date)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              {item.id && (
                <View style={styles.actionsContainer}>
                  {item.type === 'task' ? (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleTaskToggle(item.id!, currentStatus as 'todo' | 'done')}
                    >
                      <Ionicons 
                        name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} 
                        size={24} 
                        color="#F5F5F5" 
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDelete(item.id!, item.type as 'memory' | 'reminder')}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={20} 
                        color="#F5F5F5" 
                      />
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
    borderWidth: 1,
    borderColor: '#4B4B4B',
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
    backgroundColor: '#4B4B4B',
    borderRadius: 12,
    padding: 8,
  },
});

export default DisplayMessage;
