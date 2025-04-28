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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';

interface TaskEditModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => void;
  onDelete?: (taskId: number) => void;
}

export default function TaskEditModal({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState(task.category);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(new Date(task.due_date));
  const [reminderTime, setReminderTime] = useState(
    task.reminder_time ? new Date(task.reminder_time) : new Date(task.due_date)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(!!task.reminder_time);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isSettingReminder, setIsSettingReminder] = useState(false);

  const availableTags = ['Personal', 'Work', 'Shopping', 'Health', 'Family', 'Reminders'];

  const handleSave = () => {
    onSave({
      title,
      description: description || null,
      category,
      priority: priority as Task['priority'],
      status: status as Task['status'],
      due_date: dueDate.toISOString(),
      reminder_time: reminderEnabled ? reminderTime.toISOString() : null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (task.id && onDelete) {
      onDelete(task.id);
    }
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentPicker = isSettingReminder ? setShowReminderDatePicker : setShowDatePicker;
    currentPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      if (isSettingReminder) {
        const newDate = new Date(reminderTime);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setReminderTime(newDate);
      } else {
        const newDate = new Date(dueDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setDueDate(newDate);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentPicker = isSettingReminder ? setShowReminderTimePicker : setShowTimePicker;
    currentPicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      if (isSettingReminder) {
        const newDate = new Date(reminderTime);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setReminderTime(newDate);
      } else {
        const newDate = new Date(dueDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setDueDate(newDate);
      }
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const TagPickerModal = () => (
    <Modal
      visible={showTagPicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTagPicker(false)}>
      <Pressable 
        style={styles.tagPickerOverlay}
        onPress={() => setShowTagPicker(false)}>
        <Pressable 
          style={styles.tagPickerContent}
          onPress={e => e.stopPropagation()}>
          <View style={styles.tagPickerHeader}>
            <Text style={styles.tagPickerTitle}>Select Tag</Text>
            <TouchableOpacity onPress={() => setShowTagPicker(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagGrid}>
            {availableTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  category === tag && styles.selectedTagButton,
                ]}
                onPress={() => {
                  setCategory(tag);
                  setShowTagPicker(false);
                }}>
                <Text
                  style={[
                    styles.tagButtonText,
                    category === tag && styles.selectedTagButtonText,
                  ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <Pressable style={styles.modalContainer} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => {
          e.stopPropagation();
        }}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Add/Edit Task</Text>
          </View>
          <TextInput
            style={[styles.titleInput, { fontSize: 32 }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor="#999"
          />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            <TextInput
              style={styles.notesInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description..."
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setStatus(status === 'done' ? 'todo' : 'done')}>
              <Ionicons
                name={status === 'done' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color="#666"
              />
              <Text style={styles.actionButtonText}>Mark as complete</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Due Date Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={24} color="#666" />
                <Text style={styles.sectionTitle}>Due Date</Text>
              </View>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity 
                  style={styles.dateTimeButton} 
                  onPress={() => {
                    setShowDatePicker(true);
                    setIsSettingReminder(false);
                  }}>
                  <Text style={styles.dateTimeButtonText}>{formatDate(dueDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setShowTimePicker(true);
                    setIsSettingReminder(false);
                  }}>
                  <Text style={styles.dateTimeButtonText}>{formatTime(dueDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Reminder Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="notifications-outline" size={24} color="#666" />
                <Text style={styles.sectionTitle}>Reminder</Text>
                <Switch
                  style={{ marginLeft: 'auto' }}
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                />
              </View>
              {reminderEnabled && (
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity 
                    style={styles.dateTimeButton} 
                    onPress={() => {
                      setShowReminderDatePicker(true);
                      setIsSettingReminder(true);
                    }}>
                    <Text style={styles.dateTimeButtonText}>{formatDate(reminderTime)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => {
                      setShowReminderTimePicker(true);
                      setIsSettingReminder(true);
                    }}>
                    <Text style={styles.dateTimeButtonText}>{formatTime(reminderTime)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Date/Time Pickers */}
            {(showDatePicker || showReminderDatePicker) && (
              <DateTimePicker
                value={isSettingReminder ? reminderTime : dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                onChange={handleDateChange}
                style={Platform.OS === 'ios' ? styles.dateTimePicker : undefined}
              />
            )}

            {(showTimePicker || showReminderTimePicker) && (
              <DateTimePicker
                value={isSettingReminder ? reminderTime : dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                onChange={handleTimeChange}
                style={Platform.OS === 'ios' ? styles.dateTimePicker : undefined}
              />
            )}

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowTagPicker(true)}>
              <Ionicons name="pricetag-outline" size={24} color="#666" />
              <View style={styles.tagButtonContent}>
                <Text style={styles.actionButtonText}>Tags</Text>
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{category}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <TagPickerModal />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
    paddingHorizontal: 8,
    paddingVertical: 24,
  },
  header: {
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  titleInput: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 17,
    color: '#333',
  },
  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeButton: {
    paddingVertical: 4,
  },
  dateTimeButtonText: {
    fontSize: 17,
    color: '#333',
  },
  tagButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTagText: {
    fontSize: 15,
    color: '#666',
  },
  tagPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPickerContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    padding: 20,
  },
  tagPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tagPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedTagButton: {
    backgroundColor: '#007AFF',
  },
  tagButtonText: {
    fontSize: 15,
    color: '#666',
  },
  selectedTagButtonText: {
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  notesInput: {
    fontSize: 17,
    color: '#333',
    paddingVertical: 8,
  },
  sectionContainer: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  dateTimeContainer: {
    marginLeft: 36,
  },
  dateTimePicker: {
    // Add any specific styles for the date/time picker if needed
  },
});

