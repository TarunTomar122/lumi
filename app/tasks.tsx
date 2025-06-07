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

  const handleSubmit = async () => {
    // Enhanced regex to capture title, time, and date information
    // Supports formats like:
    // - "do this at 9pm tom"
    // - "do this at 9pm tomorrow"
    // - "do this at 9pm friday"
    // - "do this at 9pm on 29th may"
    // - "do this at 9pm"
    // - "do this"

    const taskRegex =
      /^(.*?)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap]m))?(?:\s+(?:on\s+)?(tom|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thur|fri|sat|sun\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)))?$/i;

    const match = userResponse.match(taskRegex);
    let title = '';
    let time = '';
    let dateStr = '';

    if (match) {
      title = match[1].trim();

      // Process time if provided
      if (match[2]) {
        const hour = parseInt(match[2]);
        const minutes = match[3] || '00';
        const meridiem = match[4].toLowerCase();
        const formattedHour = hour.toString().padStart(2, '0');
        time = `${formattedHour}:${minutes} ${meridiem.toUpperCase()}`;
      }

      // Process date if provided
      if (match[5]) {
        dateStr = match[5].toLowerCase().trim();
      }
    }

    if (!title) return; // Don't create task if no title

    // Parse the date
    let targetDate = DateTime.now().setZone('Asia/Kolkata');

    if (dateStr) {
      if (dateStr === 'tom' || dateStr === 'tomorrow') {
        targetDate = targetDate.plus({ days: 1 });
      } else if (
        [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
          'mon',
          'tue',
          'wed',
          'thur',
          'fri',
          'sat',
          'sun',
        ].includes(dateStr)
      ) {
        // Find the next occurrence of this day
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sun',
          'mon',
          'tue',
          'wed',
          'thur',
          'fri',
          'sat',
        ];
        const targetDayIndex = dayNames.indexOf(dateStr);
        const currentDayIndex = targetDate.weekday % 7; // Convert to Sunday = 0 format

        let daysToAdd = targetDayIndex - currentDayIndex;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Next week if it's today or already passed
        }

        targetDate = targetDate.plus({ days: daysToAdd });
      } else {
        // Handle specific dates like "29th may", "15 june", etc.
        const dateFormats = [
          'd MMMM', // "29 may"
          'do MMMM', // "29th may"
          'd MMM', // "29 may"
          'do MMM', // "29th may"
        ];

        let parsedDate = null;
        for (const format of dateFormats) {
          try {
            parsedDate = DateTime.fromFormat(dateStr, format, { zone: 'Asia/Kolkata' });
            if (parsedDate.isValid) {
              // Set the year to current year, or next year if the date has passed
              const currentYear = DateTime.now().year;
              parsedDate = parsedDate.set({ year: currentYear });

              // If the date has already passed this year, set it to next year
              if (parsedDate < DateTime.now()) {
                parsedDate = parsedDate.set({ year: currentYear + 1 });
              }

              targetDate = parsedDate;
              break;
            }
          } catch (error) {
            // Continue to next format
          }
        }
      }
    }

    let taskData: {
      title: string;
      due_date?: string;
      reminder_date?: string;
      status: 'todo';
      created_at: string;
    } = {
      title,
      status: 'todo',
      created_at: new Date().toISOString(),
    };

    // Set the date and time
    if (time) {
      // Parse the time and combine with the target date
      const timeOnly = DateTime.fromFormat(time, 'hh:mm a');
      if (timeOnly.isValid) {
        const finalDateTime = targetDate.set({
          hour: timeOnly.hour,
          minute: timeOnly.minute,
          second: 0,
          millisecond: 0,
        });

        const isoDate = finalDateTime.toISO();
        if (isoDate) {
          taskData.due_date = isoDate;
          taskData.reminder_date = isoDate;
        }
      }
    } else if (dateStr) {
      // If only date is provided (no time), set it to start of day
      const finalDateTime = targetDate.startOf('day');
      const isoDate = finalDateTime.toISO();
      if (isoDate) {
        taskData.due_date = isoDate;
        taskData.reminder_date = isoDate;
      }
    }

    // save the task
    await clientTools.addTask(taskData);
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
          {tasks.length === 0 && (
            <View style={styles.noTasksContainer}>
              <Text style={styles.noTasksText}>This feels too empty. Add some stuff to do!</Text>
              <Text style={styles.suggestionText}>"do this at 8am"</Text>
              <Text style={styles.suggestionText}>"do this at 9pm tomorrow"</Text>
              <Text style={styles.suggestionText}>"do this friday"</Text>
            </View>
          )}
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
            placeholder="do this at 9pm tom"
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
  noTasksContainer: {
    flex: 1,
    gap: 12,
  },
  noTasksText: {
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#000000',
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
