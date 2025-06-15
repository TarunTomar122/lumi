import { useNavigation, useRouter } from 'expo-router';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Keyboard,
  StatusBar,
} from 'react-native';
import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Message from './components/Message';
import { getNotificationSummary, talkToAgent } from '@/utils/agent';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
import { useTaskStore } from './store/taskStore';
import { useMemoryStore } from './store/memoryStore';
import { useUsageStore } from './store/usageStore';
import { useUserStore } from './store/userStore';
import HomeCard from './components/HomeCard';
import HeartAnimation from './components/HeartAnimation';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreens } from './components/OnboardingScreens';
import { clientTools, sendInstantNotification } from '@/utils/tools';
import { UsageChart } from './components/UsageChart';
import BackgroundFetch from 'react-native-background-fetch';
import { DateTime } from 'luxon';
const MAX_HISTORY = 50;

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

export default function Page() {
  const navigation = useNavigation();
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState<string>('');
  const { messageHistory, updateMessageHistory } = useMessageStore();
  const { refreshTasks } = useTaskStore();
  const { refreshMemories } = useMemoryStore();
  const { usageData, refreshUsageData } = useUsageStore();
  const { username, hasCompletedOnboarding, isLoading } = useUserStore();
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isThinking, setIsThinking] = React.useState(false);
  const [assistantResponse, setAssistantResponse] = React.useState('');
  const [activeContent, setActiveContent] = React.useState<string>('home');
  const usageDataRef = React.useRef<AppUsage[]>([]);
  const [, setUsageUpdateTrigger] = React.useState<number>(0);

  // const manuallyTriggerFetch = async () => {
  //   try {
  //     await BackgroundFetch.configure(
  //       {
  //         minimumFetchInterval: 15,
  //         stopOnTerminate: false,
  //         enableHeadless: true,
  //         startOnBoot: true,
  //       },
  //       async taskId => {
  //         console.log('BackgroundFetch taskId:', taskId);
  //         try {
  //           // send usage summary to agent
  //           const { title, body } = await getNotificationSummary();
  //           await sendInstantNotification(title, body);
  //         } catch (error) {
  //           console.error('Background fetch task failed:', error);
  //         } finally {
  //           // REQUIRED: Signal to the OS that your task is complete
  //           BackgroundFetch.finish(taskId);
  //         }
  //       },
  //       error => {
  //         console.error('[BackgroundFetch] Failed to configure:', error);
  //       }
  //     );

  //     // Force immediate execution
  //     await BackgroundFetch.start();

  //     // Execute the task immediately
  //     const taskId = 'immediate-fetch';
  //     await BackgroundFetch.scheduleTask({
  //       taskId,
  //       delay: 0, // Execute immediately
  //       periodic: false,
  //       forceAlarmManager: true, // Force immediate execution
  //     });

  //     console.log('[BackgroundFetch] Manual fetch triggered');
  //   } catch (error) {
  //     console.error('[BackgroundFetch] configure ERROR:', error);
  //   }
  // };

  const fetchUsageData = React.useCallback(async () => {
    const result = await clientTools.getUsageStats();
    if (result.success && result.appUsageStats) {
      const usageArray = Object.entries(result.appUsageStats)
        .map(([_, data]) => ({
          appName: data.appName || 'Unknown App',
          totalTimeInForeground: data.totalTimeInForeground || 0,
        }))
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
        .slice(0, 3);

      usageDataRef.current = usageArray;
      setUsageUpdateTrigger((prev: number) => prev + 1);
    }
  }, []);

  const checkReflectionToday = async () => {
    try {
      const result = await clientTools.getAllReflections();
      if (result.success && result.reflections) {
        const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
        const todayReflection = result.reflections.find(reflection => 
          DateTime.fromISO(reflection.date).setZone('Asia/Kolkata').toISODate() === today
        );
        return !!todayReflection;
      }
      return false;
    } catch (error) {
      console.error('Error checking today\'s reflection:', error);
      return false;
    }
  };

  const handleOnboardingComplete = (newUsername: string) => {
    // User store handles the username setting
  };

  React.useEffect(() => {
    refreshUsageDataWithRetry();
  }, []);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for database to be ready (from _layout.tsx)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Configure background fetch for daily reflection reminders
        BackgroundFetch.configure(
          {
            minimumFetchInterval: 60*4, // 4 hours in minutes
            stopOnTerminate: false,
            enableHeadless: true,
            startOnBoot: true,
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
            requiresCharging: false,
            requiresDeviceIdle: false,
            requiresBatteryNotLow: false,
          },
          async taskId => {
            console.log('BackgroundFetch taskId:', taskId);
            try {
              const now = DateTime.now().setZone('Asia/Kolkata');
              const hours = now.hour;
              
              // Check if it's later than 7PM
              if (hours >= 19) {
                const hasReflectionToday = await checkReflectionToday();
                if (!hasReflectionToday) {
                  await sendInstantNotification(
                    'Time to reflect 🌙',
                    'How was your day? Add a quick reflection before bed.'
                  );
                }
              }
            } catch (error) {
              console.error('Background fetch task failed:', error);
            } finally {
              BackgroundFetch.finish(taskId);
            }
          },
          error => {
            console.error('[BackgroundFetch] Failed to configure:', error);
          }
        );
        
        // Start the background fetch service
        BackgroundFetch.start();

        // Initialize data with proper retry logic
        await Promise.all([
          refreshTasks(),
          refreshMemories()
        ]);
        
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const refreshUsageDataWithRetry = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        await refreshUsageData();
        console.log('✅ Usage data refreshed successfully');
        break;
      } catch (error) {
        console.log(`❌ Usage data fetch failed, retries left: ${retries - 1}`);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
    }
  };

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const navigateTo = (path: 'tasks' | 'notes' | 'habits' | 'reflections' | '') => {
    router.push(`/${path}`);
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
      }
    };
  }, []);

  if (!hasCompletedOnboarding) {
    return <OnboardingScreens onComplete={handleOnboardingComplete} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {activeContent === 'home' && (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello {username}</Text>
            <Ionicons name="sparkles-outline" size={24} color="#000000" />
          </View>
          <View style={styles.mainArea}>
            <View style={styles.cardsContainer}>
              <View style={styles.row}>
                <HomeCard
                  title="Tasks"
                  icon="checkmark-circle-outline"
                  onPress={() => {
                    router.push('/tasks');
                  }}
                />
                <HomeCard
                  title="Notes"
                  icon="bulb-outline"
                  onPress={() => {
                    router.push('/notes');
                  }}
                />
              </View>
              <View style={styles.row}>
                <HomeCard
                  title="Habits"
                  icon="bar-chart-outline"
                  onPress={() => {
                    router.push('/habits');
                  }}
                />
                <HomeCard
                  title="Reflections"
                  icon="calendar-outline"
                  onPress={() => {
                    router.push('/reflections');
                  }}
                />
              </View>
            </View>
            <UsageChart usageData={usageData} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 40,
    gap: 48,
  },
  container: {
    flex: 1,
    padding: 24,
    marginBottom: 20,
  },
  mainArea: {
    flex: 1,
    gap: 16,
  },
  agentChatContainer: {
    flex: 1,
    padding: 32,
  },
  inputContainer: {
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
  },
  chatHeader: {
    marginVertical: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderText: {
    fontSize: 28,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  cardsContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  disabledRow: {
    opacity: 0.5,
  },
  messageContainer: {
    flex: 1,
  },
  messageContentContainer: {
    paddingBottom: 20,
  },
  messagesWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
