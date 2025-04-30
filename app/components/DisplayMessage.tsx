import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientTools } from '@/utils/tools';

export type DisplayMessageType = 'info' | 'success' | 'error' | 'warning';

export interface DisplayMessageItem {
  text: string;
  type: DisplayMessageType;
  icon?: string;
  id?: number;
  status?: 'todo' | 'in_progress' | 'done';
}

interface DisplayMessageProps {
  items: DisplayMessageItem[];
}

const COLORS = {
  info: '#2B2B2B',
  success: '#2B2B2B',
  error: '#2B2B2B',
  warning: '#2B2B2B',
};

const DisplayMessage: React.FC<DisplayMessageProps> = ({ items }) => {
  // Keep track of task statuses with a Map to store both completed and uncompleted states
  const [taskStatuses, setTaskStatuses] = useState<Map<number, 'done' | 'todo'>>(new Map());
  
  const handleTaskToggle = async (id: number, currentStatus: 'todo' | 'in_progress' | 'done' = 'todo') => {
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

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
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
              <Text style={[
                styles.text,
                isCompleted && styles.completedText
              ]}>
                {item.icon ? `${item.icon} ` : ''}{item.text}
              </Text>
              {item.id && (
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={() => item.id && handleTaskToggle(item.id, currentStatus as 'todo' | 'in_progress' | 'done')}
                >
                  <Ionicons 
                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={32} 
                    color="#F5F5F5" 
                  />
                </TouchableOpacity>
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
    padding: 12,
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#F5F5F5',
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkbox: {
    marginLeft: 12,
  },
});

export default DisplayMessage;
