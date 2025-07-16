import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';
import { useTheme } from '@/hooks/useTheme';
import { clientTools } from '@/utils/tools';
import ProductivityPatterns from './components/TaskHistoryChart';
import RecentTimeline from './components/RecentTimeline';
import type { Task } from '@/utils/database';

export default function TaskHistory() {
  const router = useRouter();
  const { colors, createThemedStyles } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadTaskHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await clientTools.getTaskHistory(30); // Get last 30 days
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      }
    } catch (error) {
      console.error('Error loading task history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadTaskHistory();
    setRefreshing(false);
  }, [loadTaskHistory]);

  React.useEffect(() => {
    loadTaskHistory();
  }, [loadTaskHistory]);

  const styles = createThemedStyles(colors => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderBottomColor: colors.border,
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
      color: colors.text,
      marginBottom: getResponsiveSize(3),
    },
    container: {
      flex: 1,
    },
    scrollContainer: {
      paddingHorizontal: getResponsiveSize(20),
      paddingTop: getResponsiveSize(24),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: getResponsiveSize(60),
    },
    loadingText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginTop: getResponsiveSize(12),
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: getResponsiveSize(60),
      paddingHorizontal: getResponsiveSize(20),
    },
    emptyIcon: {
      marginBottom: getResponsiveSize(24),
    },
    emptyTitle: {
      fontSize: getResponsiveSize(20),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: getResponsiveSize(8),
    },
    emptyText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: getResponsiveSize(24),
    },
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={getResponsiveSize(24)} color={colors.text} />
            <Text style={styles.backText}>Task History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={getResponsiveSize(48)} color={colors.textSecondary} />
          <Text style={styles.loadingText}>Loading your task history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tasks.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={getResponsiveSize(24)} color={colors.text} />
            <Text style={styles.backText}>Task History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="analytics-outline" size={getResponsiveSize(64)} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Task History</Text>
          <Text style={styles.emptyText}>
            Complete some tasks to see your productivity patterns and recent activity here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={getResponsiveSize(24)} color={colors.text} />
          <Text style={styles.backText}>Task History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        <View style={styles.scrollContainer}>
          {/* Productivity Patterns */}
          <ProductivityPatterns tasks={tasks} />
          
          {/* Recent Timeline */}
          <RecentTimeline tasks={tasks} limit={15} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 