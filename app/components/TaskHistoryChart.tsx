import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getResponsiveSize } from '@/utils/responsive';
import { DateTime } from 'luxon';
import type { Task } from '@/utils/database';

interface ProductivityPatternsProps {
  tasks: Task[];
}

const ProductivityPatterns: React.FC<ProductivityPatternsProps> = ({ tasks }) => {
  const { colors, createThemedStyles } = useTheme();

  // Analyze productivity patterns
  const patterns = React.useMemo(() => {
    const dayOfWeek = Array(7).fill(0); // Mon-Sun
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const dailyCompletions: { [key: string]: number } = {};

    tasks.forEach(task => {
      if (task.completed_at) {
        const date = DateTime.fromISO(task.completed_at);
        
        // Day of week (0 = Monday, 6 = Sunday)
        dayOfWeek[date.weekday - 1]++;
        
        // Time of day
        const hour = date.hour;
        if (hour >= 6 && hour < 12) timeOfDay.morning++;
        else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
        else if (hour >= 17 && hour < 22) timeOfDay.evening++;
        else timeOfDay.night++;
        
        // Daily completions for streak calculation
        const dateKey = date.toISODate();
        if (dateKey) {
          dailyCompletions[dateKey] = (dailyCompletions[dateKey] || 0) + 1;
        }
      }
    });

    // Calculate current streak
    let currentStreak = 0;
    const today = DateTime.now();
    for (let i = 0; i < 30; i++) {
      const checkDate = today.minus({ days: i }).toISODate();
      if (checkDate && dailyCompletions[checkDate]) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Find best day
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bestDayIndex = dayOfWeek.indexOf(Math.max(...dayOfWeek));
    const bestDay = dayNames[bestDayIndex];

    // Find best time
    const timeLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
    const bestTimeKey = Object.keys(timeOfDay).reduce((a, b) => 
      timeOfDay[a as keyof typeof timeOfDay] > timeOfDay[b as keyof typeof timeOfDay] ? a : b
    ) as keyof typeof timeOfDay;
    const bestTime = timeLabels[bestTimeKey];

    return {
      dayOfWeek,
      timeOfDay,
      currentStreak,
      bestDay,
      bestTime,
      dayNames,
      totalTasks: tasks.length,
      avgPerDay: tasks.length > 0 ? (tasks.length / 30).toFixed(1) : '0'
    };
  }, [tasks]);

  const maxDayCount = Math.max(...patterns.dayOfWeek, 1);

  const styles = createThemedStyles((colors) => ({
    container: {
      padding: getResponsiveSize(20),
      backgroundColor: colors.card,
      marginVertical: getResponsiveSize(6),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: getResponsiveSize(24),
      borderRadius: 6,
    },
    title: {
      fontSize: getResponsiveSize(20),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
      marginBottom: getResponsiveSize(4),
    },
    subtitle: {
      fontSize: getResponsiveSize(12),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginBottom: getResponsiveSize(20),
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: getResponsiveSize(24),
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: getResponsiveSize(24),
      fontFamily: 'MonaSans-Bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: getResponsiveSize(11),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginTop: getResponsiveSize(4),
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
      marginBottom: getResponsiveSize(12),
    },
    dayChart: {
      marginBottom: getResponsiveSize(24),
    },
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: getResponsiveSize(80),
      marginBottom: getResponsiveSize(8),
    },
    dayContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginHorizontal: getResponsiveSize(2),
    },
    dayBar: {
      width: '80%',
      backgroundColor: colors.primary,
      borderRadius: getResponsiveSize(2),
      minHeight: getResponsiveSize(4),
      marginBottom: getResponsiveSize(8),
    },
    dayLabel: {
      fontSize: getResponsiveSize(12),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
    },
    dayCount: {
      fontSize: getResponsiveSize(10),
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
      marginBottom: getResponsiveSize(4),
    },
    timeSection: {
      marginBottom: getResponsiveSize(24),
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: getResponsiveSize(12),
    },
    timeItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: getResponsiveSize(12),
      backgroundColor: colors.surface,
      borderRadius: getResponsiveSize(6),
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeItemActive: {
      backgroundColor: colors.primary,
    },
    timeCount: {
      fontSize: getResponsiveSize(18),
      fontFamily: 'MonaSans-Bold',
      color: colors.text,
    },
    timeCountActive: {
      color: colors.background,
    },
    timeLabel: {
      fontSize: getResponsiveSize(10),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginTop: getResponsiveSize(4),
    },
    timeLabelActive: {
      color: colors.background,
    },
    insightsSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: getResponsiveSize(12),
    },
    insightItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: getResponsiveSize(16),
      backgroundColor: colors.surface,
      borderRadius: getResponsiveSize(6),
      borderWidth: 1,
      borderColor: colors.border,
    },
    insightIcon: {
      marginBottom: getResponsiveSize(8),
    },
    insightValue: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Bold',
      color: colors.text,
      marginBottom: getResponsiveSize(4),
    },
    insightLabel: {
      fontSize: getResponsiveSize(10),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: getResponsiveSize(40),
    },
    emptyIcon: {
      marginBottom: getResponsiveSize(16),
    },
    emptyText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: getResponsiveSize(8),
    },
  }));

  if (patterns.totalTasks === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Productivity Patterns</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons 
              name="analytics-outline" 
              size={getResponsiveSize(48)} 
              color={colors.textSecondary} 
            />
          </View>
          <Text style={styles.emptyText}>No patterns to analyze yet</Text>
          <Text style={styles.emptySubtext}>
            Complete some tasks to see when you're most productive
          </Text>
        </View>
      </View>
    );
  }

  // Find best time info
  const bestTimeCount = patterns.timeOfDay[patterns.bestTime.toLowerCase() as keyof typeof patterns.timeOfDay];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productivity Patterns</Text>
      <Text style={styles.subtitle}>Last 30 days</Text>
      
      {/* Overview Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{patterns.totalTasks}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{patterns.avgPerDay}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{patterns.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
      </View>

      {/* Days of Week Chart */}
      <View style={styles.dayChart}>
        <Text style={styles.sectionTitle}>Days of the Week</Text>
        <View style={styles.dayRow}>
          {patterns.dayOfWeek.map((count, index) => {
            const barHeight = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
            return (
              <View key={index} style={styles.dayContainer}>
                {count > 0 && (
                  <Text style={styles.dayCount}>{count}</Text>
                )}
                <View
                  style={[
                    styles.dayBar,
                    { height: Math.max(getResponsiveSize(4), (barHeight / 100) * getResponsiveSize(60)) }
                  ]}
                />
                <Text style={styles.dayLabel}>{patterns.dayNames[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Time of Day */}
      <View style={styles.timeSection}>
        <Text style={styles.sectionTitle}>Time of Day</Text>
        <View style={styles.timeRow}>
          {Object.entries(patterns.timeOfDay).map(([time, count]) => {
            const isActive = time === patterns.bestTime.toLowerCase();
            const timeLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
            
            return (
              <View key={time} style={[styles.timeItem, isActive && styles.timeItemActive]}>
                <Text style={[styles.timeCount, isActive && styles.timeCountActive]}>{count}</Text>
                <Text style={[styles.timeLabel, isActive && styles.timeLabelActive]}>
                  {timeLabels[time as keyof typeof timeLabels]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Key Insights */}
      <View style={styles.insightsSection}>
        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="calendar-outline" size={getResponsiveSize(24)} color={colors.primary} />
          </View>
          <Text style={styles.insightValue}>{patterns.bestDay}</Text>
          <Text style={styles.insightLabel}>Most Productive Day</Text>
        </View>
        
        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="time-outline" size={getResponsiveSize(24)} color={colors.primary} />
          </View>
          <Text style={styles.insightValue}>{patterns.bestTime}</Text>
          <Text style={styles.insightLabel}>Best Time ({bestTimeCount} tasks)</Text>
        </View>
      </View>
    </View>
  );
};

export default ProductivityPatterns; 