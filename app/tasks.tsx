import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InputContainer from './components/inputContainer';
import { useTaskStore } from './store/taskStore';
import { formatDate } from '@/utils/commons';

export default function Tasks() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { tasks, updateTask, refreshTasks } = useTaskStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setRefreshing(false);
  }, []);

  const handleSubmit = () => {
    // TODO: Implement task submission
    console.log('Submitting task:', userResponse);
  };

  const handleTaskToggle = async (id: number, currentStatus: 'todo' | 'done') => {
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await updateTask(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>tasks</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
          {tasks.map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <View style={styles.taskContent}>
                <Text style={[styles.taskText, task.status === 'done' && styles.taskTextCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskDate}>
                  {formatDate(task.due_date || task.reminder_date || '')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.taskCheckbox, task.status === 'done' && styles.taskCheckboxChecked]}
                onPress={() => handleTaskToggle(task.id!, task.status)}>
                {task.status === 'done' && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#000000',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 4,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskDate: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
});
