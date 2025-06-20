import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from './store/habitStore';
import { HabitHistory } from './components/HabitHistory';
import type { Habit } from '@/utils/database';
import { DateTime } from 'luxon';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function Habits() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedHabitId, setExpandedHabitId] = React.useState<number | null>(null);
  const [isAddingHabit, setIsAddingHabit] = React.useState(false);
  const [newHabitTitle, setNewHabitTitle] = React.useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { habits, updateHabitProgress, refreshHabits, getWeekProgress, addHabit, deleteHabit } =
    useHabitStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHabits();
    } catch (error) {
      console.error('Error refreshing habits:', error);
    }
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    refreshHabits();
  }, []);

  const toggleExpand = (habitId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedHabitId(expandedHabitId === habitId ? null : habitId);
  };

  const ProgressCircles = ({
    habit,
    onDayPress,
  }: {
    habit: Habit;
    onDayPress: (date: string) => void;
  }) => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const progress = getWeekProgress(habit);

    // Get array of ISO date strings for current week starting from Monday
    const weekDates = React.useMemo(() => {
      const now = DateTime.now();
      const monday = now.startOf('week'); // Luxon uses Monday as start of week by default
      return Array.from({ length: 7 }, (_, i) => monday.plus({ days: i }).toISODate() || '');
    }, []);

    return (
      <View style={styles.progressContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day}</Text>
            <TouchableOpacity
              onPress={() => onDayPress(weekDates[index])}
              style={[
                styles.circle,
                progress[index] && { backgroundColor: habit.color },
                !progress[index] && { backgroundColor: '#fafafa' }, // Light pink background for non-completed days
              ]}
            />
          </View>
        ))}
      </View>
    );
  };

  const handleDayPress = (habit: Habit, date: string) => {
    if (habit.id !== undefined) {
      updateHabitProgress(habit.id.toString(), date);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return;

    await addHabit(newHabitTitle.trim());

    setNewHabitTitle('');
    setIsAddingHabit(false);
    refreshHabits();
  };

  const handleAddHabitPress = () => {
    setIsAddingHabit(true);
    // Scroll to bottom to ensure input is visible
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDeleteHabit = async (habitId: number, habitTitle: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habitTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habitId.toString());
            refreshHabits();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#000000" />
          <Text style={styles.backText}>Habits</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.habitsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>

          {habits.length === 0 && (
            <View style={styles.noHabitsContainer}>
              <Text style={styles.noHabitsText}>No habits yet.</Text>
              <Text style={styles.noHabitsText}>Start by adding a habit.</Text>
            </View>
          )}

          {habits.map(habit => (
            <View key={habit.id} style={styles.habitItem}>
              <TouchableOpacity
                onPress={() => habit.id && toggleExpand(habit.id)}
                style={styles.habitHeader}>
                <View style={styles.habitHeaderContent}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <TouchableOpacity
                    onPress={() => habit.id && handleDeleteHabit(habit.id, habit.title)}
                    style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={getResponsiveSize(20)} color="#000000" />
                  </TouchableOpacity>
                </View>
                <View style={styles.habitHeaderActions}>
                  <Ionicons
                    name={expandedHabitId === habit.id ? 'chevron-up' : 'chevron-down'}
                    size={getResponsiveSize(24)}
                    color="#000000"
                  />
                </View>
              </TouchableOpacity>
              {expandedHabitId === habit.id ? (
                <View style={styles.habitHistoryContainer}>
                  <HabitHistory habit={habit} onClose={() => toggleExpand(habit.id!)} />
                </View>
              ) : (
                <ProgressCircles habit={habit} onDayPress={date => handleDayPress(habit, date)} />
              )}
            </View>
          ))}

          {/* Add Habit Button or Input */}
          <View style={[styles.addHabitContainer, isAddingHabit && { opacity: 1 }]}>
            {isAddingHabit ? (
              <View style={styles.addHabitInputContainer}>
                <TextInput
                  style={styles.addHabitInput}
                  value={newHabitTitle}
                  onChangeText={setNewHabitTitle}
                  placeholder="Reading..."
                  autoFocus
                  onBlur={() => setIsAddingHabit(false)}
                  onSubmitEditing={handleAddHabit}
                  onFocus={() => {
                    // Ensure input stays visible when focused
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addHabitButton}
                onPress={handleAddHabitPress}>
                <Ionicons name="add-circle-outline" size={getResponsiveSize(32)} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: getResponsiveHeight(28),
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
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(20),
    paddingTop: getResponsiveSize(24),
  },
  habitsList: {
    flex: 1,
  },
  habitItem: {
    marginBottom: getResponsiveSize(24),
    padding: getResponsiveSize(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: getResponsiveSize(6),
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(24),
  },
  habitHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12),
  },
  habitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12),
  },
  habitTitle: {
    fontSize: getResponsiveSize(24),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: getResponsiveSize(2),
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: getResponsiveSize(12),
    color: '#666',
    marginBottom: getResponsiveSize(4),
  },
  circle: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  habitHistoryContainer: {
    marginTop: getResponsiveSize(16),
  },
  addHabitContainer: {
    marginTop: 0,
    alignItems: 'center',
    opacity: 0.4,
  },
  addHabitButton: {
    padding: getResponsiveSize(12),
  },
  addHabitInputContainer: {
    width: '100%',
    padding: getResponsiveSize(24),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12),
    marginBottom: getResponsiveSize(24),
  },
  addHabitInput: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
  },
  deleteButton: {
    padding: getResponsiveSize(4),
    alignItems: 'flex-end',
    marginBottom: getResponsiveSize(-4),
  },
  noHabitsContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: getResponsiveHeight(100),
    marginBottom: getResponsiveSize(24),
  },
  noHabitsText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
});
