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
import { parseTaskInput } from '@/utils/taskParser';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';

const SwipeableTaskItem = ({ task, onToggle, onDelete, isDemo = false, onDemoComplete }: any) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(0);
  const itemOpacity = useSharedValue(1);
  const screenWidth = Dimensions.get('window').width;
  
  const DELETE_THRESHOLD = 0.3; // 30% of screen width to trigger delete
  const REVEAL_THRESHOLD = 0.15; // 15% of screen width to reveal delete button

  const handleDelete = async () => {
    await onDelete(task.id);
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
              <Ionicons name="trash-outline" size={getResponsiveSize(24)} color="#OOOOOO" />
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
              {task.status === 'done' && <Ionicons name="checkmark" size={getResponsiveSize(20)} color="#FFFFFF" />}
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
  const [activeContent, setActiveContent] = React.useState<string>('home');
  const [showDemo, setShowDemo] = React.useState(false);
  const [demoCount, setDemoCount] = React.useState(0);
  const [groupedTasks, setGroupedTasks] = React.useState<{ [key: string]: typeof tasks }>({});
  const [shouldRegroup, setShouldRegroup] = React.useState(true);

  React.useEffect(() => {
    refreshTasks();
    loadDemoCount();
  }, []);

  // Group and sort tasks when needed
  React.useEffect(() => {
    if (shouldRegroup) {
      const grouped: { [key: string]: typeof tasks } = {};
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

        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(task);
      });

      // Sort tasks within each group: incomplete tasks first, completed tasks last
      Object.keys(grouped).forEach(groupKey => {
        grouped[groupKey].sort((a, b) => {
          // If one task is done and the other isn't, put the incomplete task first
          if (a.status === 'done' && b.status !== 'done') return 1;
          if (a.status !== 'done' && b.status === 'done') return -1;
          // If both have the same status, maintain original order
          return 0;
        });
      });

      setGroupedTasks(grouped);
      setShouldRegroup(false);
    }
  }, [tasks, shouldRegroup]);

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
      setShouldRegroup(true); // Trigger regrouping on manual refresh
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setRefreshing(false);
  }, []);

    const handleSubmit = async () => {
    if (!userResponse.trim()) return; // Don't create task if no input

    try {
      // Parse the user input using the utility function
      const taskData = parseTaskInput(userResponse);

      // Save the task
      await clientTools.addTask(taskData);
      await refreshTasks();
      setShouldRegroup(true); // Trigger regrouping when new task is added
      
      // Clear the input
      setUserResponse('');
    } catch (error) {
      console.error('Error creating task:', error);
      // Could show an alert to user if needed
    }
  };

  const handleTaskToggle = async (id: number, currentStatus: 'todo' | 'done') => {
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await updateTask(id, { status: newStatus });
      // Don't trigger regrouping on toggle - only on manual refresh
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleTaskDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setShouldRegroup(true); // Trigger regrouping after deletion
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#000000" />
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
                // Use the grouped tasks from state
                const today = DateTime.now().setZone('Asia/Kolkata').startOf('day');

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
                    const firstTask = groupedTasks[sectionKey]?.[0];
                    if (firstTask) {
                      const taskDateStr = firstTask.due_date || firstTask.reminder_date;
                      if (taskDateStr) {
                        sectionDates[sectionKey] = DateTime.fromISO(taskDateStr).setZone('Asia/Kolkata').startOf('day');
                      } else {
                        sectionDates[sectionKey] = null;
                      }
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
                        {groupedTasks[sectionKey].map((cachedTask, index) => {
                          // Get current task data from store for real-time status updates
                          const currentTask = tasks.find(t => t.id === cachedTask.id) || cachedTask;
                          return (
                            <SwipeableTaskItem
                              key={`${cachedTask.id}-${sectionKey}-${index}`}
                              task={currentTask}
                              onToggle={handleTaskToggle}
                              onDelete={handleTaskDelete}
                              isDemo={showDemo && sectionIndex === 0 && index === 0}
                              onDemoComplete={() => {
                                setShowDemo(false);
                                incrementDemoCount();
                              }}
                            />
                          );
                        })}
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
    paddingTop: getResponsiveHeight(28),
  },
  container: {
    flex: 1,
    padding: getResponsiveSize(24),
  },
  noTasksContainer: {
    flex: 1,
    gap: getResponsiveSize(12),
  },
  noTasksText: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: getResponsiveSize(4),
  },
  suggestionText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Roboto-Regular',
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveHeight(20),
    paddingBottom: getResponsiveSize(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveSize(12),
  },
  backText: {
    fontSize: getResponsiveSize(24),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(3),
  },
  title: {
    fontSize: getResponsiveSize(32),
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  taskList: {
    flex: 1,
    paddingRight: getResponsiveSize(8),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: getResponsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: getResponsiveSize(12),
    marginBottom: getResponsiveSize(12),
  },
  taskCheckbox: {
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(4),
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: getResponsiveSize(4),
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
    fontSize: getResponsiveSize(20),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: getResponsiveSize(4),
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskDate: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  inputContainer: {
    paddingHorizontal: getResponsiveSize(24),
    marginBottom: getResponsiveSize(24),
  },
  sectionHeader: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Medium',
    color: '#666666',
    marginTop: getResponsiveSize(24),
    marginBottom: getResponsiveSize(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  firstSectionHeader: {
    marginTop: 0,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: getResponsiveSize(12),
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
    paddingLeft: getResponsiveSize(24),
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    padding: getResponsiveSize(20),
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
    fontSize: getResponsiveSize(20),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(24),
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: getResponsiveSize(12),
  },
  emptyStateSubtitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: getResponsiveSize(20),
    textAlign: 'center',
    lineHeight: getResponsiveSize(22),
  },
  examplesContainer: {
    gap: getResponsiveSize(16),
    marginBottom: getResponsiveSize(20),
  },
  exampleItem: {
    gap: getResponsiveSize(4),
  },
  exampleText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    fontStyle: 'italic',
  },
  exampleDescription: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Roboto-Regular',
    color: '#999999',
  },
  emptyStateFooter: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    textAlign: 'center',
  },

});
