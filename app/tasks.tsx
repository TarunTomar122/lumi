import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InputContainer from './components/inputContainer';
import { useTaskStore } from './store/taskStore';
import { formatDate } from '@/utils/commons';
import { talkToAgent } from '@/utils/agent';
import { useMessageStore } from './store/messageStore';
import HeartAnimation from './components/HeartAnimation';
export default function Tasks() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { tasks, updateTask, refreshTasks } = useTaskStore();
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const [assistantResponse, setAssistantResponse] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState<string>('home');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setRefreshing(false);
  }, []);

  const navigateTo = (path: 'tasks' | 'notes' | 'habits' | 'reflections' | '') => {
    router.push(`/${path}`);
  };

  const handleSubmit = () => {
    const prePrompt = `User is on the tasks page so your default action should be to create a task unless they say otherwise. Here's what they said: ${userResponse}`;
    talkToAgent(
      prePrompt,
      updateMessageHistory,
      messageHistory,
      setAssistantResponse,
      setIsThinking,
      setIsLoading,
      setActiveContent,
      navigateTo
    );
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>Tasks</Text>
        </TouchableOpacity>
      </View>
      {activeContent === 'home' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.taskList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
            }>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  <Text
                    style={[styles.taskText, task.status === 'done' && styles.taskTextCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskDate}>
                    {formatDate(task.due_date || task.reminder_date || '')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.taskCheckbox,
                    task.status === 'done' && styles.taskCheckboxChecked,
                  ]}
                  onPress={() => handleTaskToggle(task.id!, task.status)}>
                  {task.status === 'done' && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      {activeContent === 'chat' && <HeartAnimation />}
      <View style={styles.inputContainer}>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onlyRecording={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 42,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  backText: {
    fontSize: 24,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 3,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  taskList: {
    flex: 1,
    paddingRight: 8,
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
  inputContainer: {
    padding: 24,
  },
});
