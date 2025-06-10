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
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from './store/habitStore';
import { HabitHistory } from './components/HabitHistory';
import type { Habit } from '@/utils/database';
import { DateTime } from 'luxon';

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
                !progress[index] && { backgroundColor: '#FFF0F3' }, // Light pink background for non-completed days
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
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>Habits</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ScrollView
          style={styles.habitsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
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
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.habitHeaderActions}>
                  <Ionicons
                    name={expandedHabitId === habit.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
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
          <View style={styles.addHabitContainer}>
            {isAddingHabit ? (
              <View style={styles.addHabitInputContainer}>
                <TextInput
                  style={styles.addHabitInput}
                  value={newHabitTitle}
                  onChangeText={setNewHabitTitle}
                  placeholder="Enter habit name..."
                  autoFocus
                  onBlur={() => setIsAddingHabit(false)}
                  onSubmitEditing={handleAddHabit}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addHabitButton}
                onPress={() => setIsAddingHabit(true)}>
                <Ionicons name="add-circle-outline" size={32} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  container: {
    flex: 1,
    padding: 24,
  },
  habitsList: {
    flex: 1,
  },
  habitItem: {
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  habitHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitTitle: {
    fontSize: 24,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 2,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  habitHistoryContainer: {
    marginTop: 16,
  },
  addHabitContainer: {
    marginTop: 0,
    alignItems: 'center',
    opacity: 0.5,
  },
  addHabitButton: {
    padding: 12,
  },
  addHabitInputContainer: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  addHabitInput: {
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  deleteButton: {
    padding: 4,
  },
});
