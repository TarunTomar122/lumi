import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useHabitStore } from '@/app/store/habitStore';
import type { Habit } from '@/utils/database';
import { DateTime } from 'luxon';

interface HabitHistoryProps {
  habit: Habit;
  onClose: () => void;
}

export const HabitHistory: React.FC<HabitHistoryProps> = ({ habit }) => {
  const updateProgress = useHabitStore(state => state.updateHabitProgress);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Convert habit completions to marked dates format
  const markedDates = React.useMemo(() => {
    const dates: { [key: string]: any } = {};
    
    // Add completed dates
    Object.entries(habit.completions).forEach(([date, completed]) => {
      if (completed) {
        dates[date] = {
          selected: true,
          selectedColor: habit.color,
        };
      }
    });

    // Add selected date highlight if it's different from a completed date
    if (selectedDate && !dates[selectedDate]?.selected) {
      dates[selectedDate] = {
        selected: true,
        selectedColor: '#F5A6B9',
      };
    }

    return dates;
  }, [habit.completions, selectedDate, habit.color]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    if (habit.id) {
      updateProgress(habit.id.toString(), day.dateString);
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={DateTime.now().toISODate()}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        firstDay={1}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#666666',
          selectedDayBackgroundColor: habit.color,
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#000000',
          dayTextColor: '#000000',
          textDisabledColor: '#d9e1e8',
          dotColor: habit.color,
          monthTextColor: '#000000',
          textMonthFontFamily: 'MonaSans-Medium',
          textDayFontFamily: 'MonaSans-Regular',
          textDayHeaderFontFamily: 'MonaSans-Regular',
          textMonthFontSize: 18,
          textDayFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        enableSwipeMonths={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
}); 