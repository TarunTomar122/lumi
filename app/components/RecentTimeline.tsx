import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getResponsiveSize } from '@/utils/responsive';
import { DateTime } from 'luxon';
import type { Task } from '@/utils/database';

interface RecentTimelineProps {
  tasks: Task[];
  limit?: number;
}

const RecentTimeline: React.FC<RecentTimelineProps> = ({ tasks, limit = 20 }) => {
  const { colors, createThemedStyles } = useTheme();

  // Group tasks by date
  const groupedTasks = React.useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    
    tasks.slice(0, limit).forEach(task => {
      if (task.completed_at) {
        const date = DateTime.fromISO(task.completed_at).startOf('day');
        const dateKey = date.toISODate();
        if (dateKey) {
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(task);
        }
      }
    });

    // Sort groups by date (most recent first)
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as { [key: string]: Task[] });

    return sortedGroups;
  }, [tasks, limit]);

  const formatDate = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    const now = DateTime.now();
    const diffDays = Math.floor(now.diff(date, 'days').days);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toFormat('cccc'); // Monday, Tuesday, etc.
    return date.toFormat('MMM dd'); // Jan 15, Feb 03, etc.
  };

  const formatTime = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat('h:mm a'); // 2:30 PM
  };

  const getTaskIcon = (task: Task) => {
    // Simple icon selection based on task content
    const title = task.title.toLowerCase();
    
    if (title.includes('call') || title.includes('phone')) return 'call-outline';
    if (title.includes('meeting') || title.includes('meet')) return 'people-outline';
    if (title.includes('email') || title.includes('message')) return 'mail-outline';
    if (title.includes('buy') || title.includes('shop') || title.includes('grocery')) return 'bag-outline';
    if (title.includes('workout') || title.includes('gym') || title.includes('exercise')) return 'barbell-outline';
    if (title.includes('read') || title.includes('book')) return 'book-outline';
    if (title.includes('clean') || title.includes('tidy')) return 'home-outline';
    if (title.includes('doctor') || title.includes('appointment')) return 'medical-outline';
    if (title.includes('work') || title.includes('project')) return 'briefcase-outline';
    
    return 'checkmark-circle-outline';
  };

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
    timelineContainer: {
      maxHeight: getResponsiveSize(400),
    },
    dateGroup: {
      marginBottom: getResponsiveSize(20),
    },
    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getResponsiveSize(12),
      paddingBottom: getResponsiveSize(8),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateHeaderDot: {
      width: getResponsiveSize(8),
      height: getResponsiveSize(8),
      borderRadius: getResponsiveSize(4),
      backgroundColor: colors.primary,
      marginRight: getResponsiveSize(12),
    },
    dateText: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: getResponsiveSize(12),
      paddingHorizontal: getResponsiveSize(16),
      backgroundColor: colors.surface,
      borderRadius: getResponsiveSize(8),
      marginBottom: getResponsiveSize(8),
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskIconContainer: {
      width: getResponsiveSize(36),
      height: getResponsiveSize(36),
      borderRadius: getResponsiveSize(18),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: getResponsiveSize(12),
    },
    taskContent: {
      flex: 1,
      marginRight: getResponsiveSize(12),
    },
    taskTitle: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.text,
      marginBottom: getResponsiveSize(2),
    },
    taskDescription: {
      fontSize: getResponsiveSize(12),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
    },
    taskTime: {
      fontSize: getResponsiveSize(12),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
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
    seeMoreContainer: {
      alignItems: 'center',
      paddingTop: getResponsiveSize(16),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: getResponsiveSize(12),
    },
    seeMoreText: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  }));

  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Activity</Text>
        <Text style={styles.subtitle}>Your completed tasks</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons 
              name="time-outline" 
              size={getResponsiveSize(48)} 
              color={colors.textSecondary} 
            />
          </View>
          <Text style={styles.emptyText}>No completed tasks yet</Text>
          <Text style={styles.emptySubtext}>
            Your recent completions will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      <Text style={styles.subtitle}>Your completed tasks</Text>
      
      <ScrollView 
        style={styles.timelineContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {Object.entries(groupedTasks).map(([dateKey, dayTasks]) => (
          <View key={dateKey} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <View style={styles.dateHeaderDot} />
              <Text style={styles.dateText}>{formatDate(dateKey)}</Text>
            </View>
            
            {dayTasks.map((task, index) => (
              <View key={task.id || index} style={styles.taskItem}>
                <View style={styles.taskIconContainer}>
                  <Ionicons 
                    name={getTaskIcon(task)} 
                    size={getResponsiveSize(18)} 
                    color={colors.background} 
                  />
                </View>
                
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description && (
                    <Text style={styles.taskDescription} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                </View>
                
                <Text style={styles.taskTime}>
                  {task.completed_at ? formatTime(task.completed_at) : ''}
                </Text>
              </View>
            ))}
          </View>
        ))}
        
        {tasks.length > limit && (
          <View style={styles.seeMoreContainer}>
            <Text style={styles.seeMoreText}>
              Showing {limit} most recent tasks
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RecentTimeline; 