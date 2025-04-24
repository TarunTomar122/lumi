import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '@/utils/tools';

interface TaskEditModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => void;
}

export default function TaskEditModal({ visible, task, onClose, onSave }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState(task.category);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(new Date(task.due_date));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const priorities: Task['priority'][] = ['low', 'medium', 'high'];
  const statuses: Task['status'][] = ['todo', 'in_progress', 'done'];

  const handleSave = () => {
    onSave({
      title,
      description: description || null,
      category,
      priority: priority as Task['priority'],
      status: status as Task['status'],
      due_date: dueDate.toISOString(),
    });
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Add a task"
            placeholderTextColor="#666"
          />

          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />

          <Pressable style={styles.optionRow} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.optionLabel}>Due date</Text>
            <Text style={styles.optionValue}>
              {dueDate.toLocaleDateString(undefined, { 
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <View style={styles.divider} />

          <Pressable style={styles.optionRow}>
            <Text style={styles.optionLabel}>Category</Text>
            <TextInput
              style={styles.inlineInput}
              value={category}
              onChangeText={setCategory}
              placeholder="Add category"
              placeholderTextColor="#666"
            />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.selectedPriority,
                  ]}
                  onPress={() => setPriority(p)}>
                  <Text style={[
                    styles.priorityText,
                    priority === p && styles.selectedPriorityText
                  ]}>
                    {p.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Status</Text>
            <View style={styles.statusContainer}>
              {statuses.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    status === s && styles.selectedStatus,
                  ]}
                  onPress={() => setStatus(s)}>
                  <Text style={[
                    styles.statusText,
                    status === s && styles.selectedStatusText
                  ]}>
                    {s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
    padding: 0,
  },
  descriptionInput: {
    fontSize: 16,
    marginBottom: 24,
    padding: 0,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#202124',
  },
  optionValue: {
    fontSize: 16,
    color: '#1a73e8',
  },
  inlineInput: {
    fontSize: 16,
    color: '#1a73e8',
    textAlign: 'right',
    minWidth: 100,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPriority: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  priorityText: {
    color: '#666',
    fontSize: 14,
  },
  selectedPriorityText: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F3F4',
  },
  selectedStatus: {
    backgroundColor: '#1a73e8',
  },
  statusText: {
    color: '#202124',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  selectedStatusText: {
    color: '#FFFFFF',
  },
}); 