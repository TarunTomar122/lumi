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
import { DateTime } from 'luxon';
import { clientTools } from '@/utils/tools';

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

  React.useEffect(() => {
    refreshTasks();
  }, []);

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
    // const prePrompt = `User is on the tasks page so your default action should be to create a task unless they say otherwise. Here's what they said: ${userResponse}`;
    // talkToAgent(
    //   prePrompt,
    //   updateMessageHistory,
    //   messageHistory,
    //   setAssistantResponse,
    //   setIsThinking,
    //   setIsLoading,
    //   setActiveContent,
    //   navigateTo
    // );

    // We're gonna try and make this work without internet access so basically just simple text parsing
    // So if they said 'axyz at 8am' then we'll just add a task with the title 'axyz' and the due date of 8am

    // Make the entire time portion optional and allow text after it
    const taskRegex = /^(.*?)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap]m)(?:\s+.*)?)?$/i;
    const match = userResponse.match(taskRegex);
    let title = '';
    let time = '';

    if (match) {
      title = match[1].trim();
      // Only process time if the time groups were matched
      if (match[2]) {
        const hour = parseInt(match[2]);
        const minutes = match[3] || '00';
        const meridiem = match[4].toLowerCase();
        // Convert to HH:MM AM/PM format
        const formattedHour = hour.toString().padStart(2, '0');
        time = `${formattedHour}:${minutes} ${meridiem.toUpperCase()}`;
      }
    }

    if (!title) return; // Don't create task if no title

    let taskData: { title: string; due_date?: string; status: 'todo' } = {
      title,
      status: 'todo',
    };

    // Only add due_date if time was provided
    if (time) {
      const dateTime = DateTime.fromFormat(time, 'hh:mm a').setZone('Asia/Kolkata');
      const isoDate = dateTime.toISO();
      if (isoDate) {
        taskData.due_date = isoDate;
      }
    }

    // save the task
    clientTools.addTask(taskData);
    refreshTasks();
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
          <InputContainer
            userResponse={userResponse}
            setUserResponse={setUserResponse}
            handleSubmit={handleSubmit}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onlyRecording={false}
            placeholder="do this at 8am"
          />
        </View>
      )}
      {activeContent === 'chat' && <HeartAnimation />}
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
    paddingHorizontal: 24,
    marginBottom: 24,
  },
});
