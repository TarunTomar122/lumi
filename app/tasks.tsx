import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import InputContainer from './components/inputContainer';
import { useTaskStore } from './store/taskStore';
import { formatDate } from '@/utils/commons';
import { talkToAgent } from '@/utils/agent';
import { useMessageStore } from './store/messageStore';
import HeartAnimation from './components/HeartAnimation';
import { DateTime } from 'luxon';
import { clientTools } from '@/utils/tools';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';

const SwipeableTaskItem = ({ task, onToggle, onDelete, isDemo = false, onDemoComplete }: any) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(0);
  const itemOpacity = useSharedValue(1);
  const screenWidth = Dimensions.get('window').width;
  
  const DELETE_THRESHOLD = 0.3; // 30% of screen width to trigger delete
  const REVEAL_THRESHOLD = 0.15; // 15% of screen width to reveal delete button

  const handleDelete = () => {
    onDelete(task.id);
  };

  // Demo animation effect
  React.useEffect(() => {
    if (isDemo) {
      const demoSequence = async () => {
        // Wait a bit, then swipe right
        await new Promise(resolve => setTimeout(resolve, 500));
        translateX.value = withTiming(screenWidth * REVEAL_THRESHOLD, { duration: 800 });
        
        // Hold for a moment
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Swipe back
        translateX.value = withSpring(0, { duration: 600 });
        
        // Wait for animation to complete, then notify parent
        await new Promise(resolve => setTimeout(resolve, 800));
        if (onDemoComplete) {
          runOnJS(onDemoComplete)();
        }
      };
      
      demoSequence();
    }
  }, [isDemo]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onChange((event) => {
      // Only allow swiping right (positive values)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onFinalize((event) => {
      const swipeDistance = Math.abs(event.translationX);
      const deleteThreshold = screenWidth * DELETE_THRESHOLD;
      const revealThreshold = screenWidth * REVEAL_THRESHOLD;

      if (swipeDistance > deleteThreshold) {
        // Delete the item
        translateX.value = withTiming(screenWidth, { duration: 300 });
        itemHeight.value = withTiming(0, { duration: 300 });
        itemOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(handleDelete)();
        });
      } else if (swipeDistance > revealThreshold) {
        // Snap to reveal delete button
        translateX.value = withSpring(screenWidth * REVEAL_THRESHOLD);
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value || 'auto',
    opacity: itemOpacity.value,
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > screenWidth * REVEAL_THRESHOLD * 0.5 ? 1 : 0,
  }));

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.swipeContainer}>
        {/* Delete button background */}
        <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
          <TouchableOpacity
            style={styles.deleteButtonTouchable}
            onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#OOOOOO" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main task item */}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.taskItem, animatedStyle]}>
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
              onPress={() => onToggle(task.id, task.status)}>
              {task.status === 'done' && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
};

export default function Tasks() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { tasks, updateTask, refreshTasks, deleteTask } = useTaskStore();
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const [assistantResponse, setAssistantResponse] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState<string>('home');
  const [showDemo, setShowDemo] = React.useState(false);
  const [demoCount, setDemoCount] = React.useState(0);

  React.useEffect(() => {
    refreshTasks();
    loadDemoCount();
  }, []);

  const loadDemoCount = async () => {
    try {
      const count = await AsyncStorage.getItem('swipeDemoCount');
      setDemoCount(count ? parseInt(count) : 0);
    } catch (error) {
      console.error('Error loading demo count:', error);
    }
  };

  const incrementDemoCount = async () => {
    try {
      const newCount = demoCount + 1;
      setDemoCount(newCount);
      await AsyncStorage.setItem('swipeDemoCount', newCount.toString());
    } catch (error) {
      console.error('Error saving demo count:', error);
    }
  };

  // Show demo to all users exactly 2 times
  React.useEffect(() => {
    if (tasks.length >= 1 && demoCount < 2 && !showDemo) {
      const timer = setTimeout(() => {
        setShowDemo(true);
      }, 1500); // Wait 1.5 seconds before showing demo
      
      return () => clearTimeout(timer);
    }
  }, [tasks.length, demoCount, showDemo]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setRefreshing(false);
  }, []);

  const handleSubmit = async () => {
    // Enhanced regex to capture title, time, and date information
    // Supports formats like:
    // - "do this at 9pm tom"
    // - "do this at 9pm tomorrow"
    // - "do this at 9pm friday"
    // - "do this at 9pm on 29th may"
    // - "do this at 9pm"
    // - "do this 9pm"
    // - "do this 9 pm"
    // - "do this 9PM"
    // - "do this 9 PM"
    // - "do this"

    const taskRegex =
      /^(.*?)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap]m))?(?:\s+(?:on\s+)?(tom|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thur|fri|sat|sun|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)))?$/i;

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateTitle}>Ready to get things done?</Text>

                  <View style={styles.examplesContainer}>
                    <View style={styles.exampleItem}>
                      <Text style={styles.exampleText}>"call mom at 7pm"</Text>
                      <Text style={styles.exampleDescription}>Set a specific time</Text>
                    </View>

                    <View style={styles.exampleItem}>
                      <Text style={styles.exampleText}>"gym session tomorrow"</Text>
                      <Text style={styles.exampleDescription}>Schedule for tomorrow</Text>
                    </View>

                    <View style={styles.exampleItem}>
                      <Text style={styles.exampleText}>"doctor appointment friday at 2pm"</Text>
                      <Text style={styles.exampleDescription}>Set day and time</Text>
                    </View>

                    <View style={styles.exampleItem}>
                      <Text style={styles.exampleText}>"buy groceries"</Text>
                      <Text style={styles.exampleDescription}>No time needed</Text>
                    </View>
                  </View>

                  <Text style={styles.emptyStateFooter}>Start typing in the box below! ⬇️</Text>
                </View>
              </View>
            )}
            <ScrollView
              style={styles.taskList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
              }>
              {(() => {
                // Group tasks by date
                const groupedTasks: { [key: string]: typeof tasks } = {};
                const today = DateTime.now().setZone('Asia/Kolkata').startOf('day');

                tasks.forEach(task => {
                  const taskDateStr = task.due_date || task.reminder_date;
                  let groupKey = 'No Date';

                  if (taskDateStr) {
                    const taskDate = DateTime.fromISO(taskDateStr)
                      .setZone('Asia/Kolkata')
                      .startOf('day');
                    const diffDays = Math.floor(taskDate.diff(today, 'days').days);

                    if (diffDays === 0) {
                      groupKey = 'Today';
                    } else if (diffDays === 1) {
                      groupKey = 'Tomorrow';
                    } else if (diffDays > 1 && diffDays <= 7) {
                      groupKey = taskDate.toFormat('cccc'); // Day name (e.g., "Monday")
                    } else {
                      groupKey = taskDate.toFormat('MMM dd'); // e.g., "Jan 15"
                    }
                  }

                  if (!groupedTasks[groupKey]) {
                    groupedTasks[groupKey] = [];
                  }
                  groupedTasks[groupKey].push(task);
                });

                // Create a map of section keys to their actual dates for proper sorting
                const sectionDates: { [key: string]: DateTime | null } = {};
                
                Object.keys(groupedTasks).forEach(sectionKey => {
                  if (sectionKey === 'Today') {
                    sectionDates[sectionKey] = today;
                  } else if (sectionKey === 'Tomorrow') {
                    sectionDates[sectionKey] = today.plus({ days: 1 });
                  } else if (sectionKey === 'No Date') {
                    sectionDates[sectionKey] = null; // Will be sorted last
                  } else {
                    // For day names and specific dates, find the actual date from the first task in that group
                    const firstTask = groupedTasks[sectionKey][0];
                    const taskDateStr = firstTask.due_date || firstTask.reminder_date;
                    if (taskDateStr) {
                      sectionDates[sectionKey] = DateTime.fromISO(taskDateStr).setZone('Asia/Kolkata').startOf('day');
                    } else {
                      sectionDates[sectionKey] = null;
                    }
                  }
                });

                const sortedSections = Object.keys(groupedTasks).sort((a, b) => {
                  const dateA = sectionDates[a];
                  const dateB = sectionDates[b];

                  // No Date sections go to the end
                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;

                  // Sort by actual date
                  return dateA.toMillis() - dateB.toMillis();
                });

                return sortedSections.map((sectionKey, sectionIndex) => (
                  <View key={sectionKey}>
                    {groupedTasks[sectionKey].length > 0 && (
                      <>
                        <Text
                          style={[
                            styles.sectionHeader,
                            sectionIndex === 0 && styles.firstSectionHeader,
                          ]}>
                          {sectionKey}
                        </Text>
                        {groupedTasks[sectionKey].map((task, index) => (
                          <SwipeableTaskItem
                            key={`${sectionKey}-${index}`}
                            task={task}
                            onToggle={handleTaskToggle}
                            onDelete={deleteTask}
                            isDemo={showDemo && sectionIndex === 0 && index === 0}
                            onDemoComplete={() => {
                              setShowDemo(false);
                              incrementDemoCount();
                            }}
                          />
                        ))}
                      </>
                    )}
                  </View>
                ));
              })()}
            </ScrollView>
            

            
            <InputContainer
              userResponse={userResponse}
              setUserResponse={setUserResponse}
              handleSubmit={handleSubmit}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onlyRecording={false}
              placeholder="Call mom at 9pm"
            />
          </View>
        )}
        {activeContent === 'chat' && <HeartAnimation />}
      </SafeAreaView>
    </GestureHandlerRootView>
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
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'MonaSans-Medium',
    color: '#666666',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  firstSectionHeader: {
    marginTop: 0,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  deleteBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    paddingLeft: 24,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  examplesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  exampleItem: {
    gap: 4,
  },
  exampleText: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    fontStyle: 'italic',
  },
  exampleDescription: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#999999',
  },
  emptyStateFooter: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    textAlign: 'center',
  },

});
