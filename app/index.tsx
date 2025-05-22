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
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Message from './components/Message';
import { getNotificationSummary, talkToAgent } from '@/utils/agent';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
import { useTaskStore } from './store/taskStore';
import { useMemoryStore } from './store/memoryStore';
import { useUsageStore } from './store/usageStore';
import HomeCard from './components/HomeCard';
import HeartAnimation from './components/HeartAnimation';
import { SplashScreen } from './components/SplashScreen';
import BackgroundFetch from 'react-native-background-fetch';
import { sendInstantNotification, clientTools } from '@/utils/tools';
import { UsageChart } from './components/UsageChart';
const MAX_HISTORY = 50;

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

export default function Page() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('');
  const [assistantResponse, setAssistantResponse] = React.useState<string>('');
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const { tasks, refreshTasks } = useTaskStore();
  const { memories, refreshMemories } = useMemoryStore();
  const { usageData, refreshUsageData } = useUsageStore();
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const [activeContent, setActiveContent] = React.useState<string>('home');
  const usageDataRef = React.useRef<AppUsage[]>([]);
  const [, setUsageUpdateTrigger] = React.useState(0);

  const manuallyTriggerFetch = async () => {
    try {
      await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15,
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
        },
        async taskId => {
          console.log('BackgroundFetch taskId:', taskId);
          try {
            // send usage summary to agent
            const { title, body } = await getNotificationSummary();
            await sendInstantNotification(title, body);
          } catch (error) {
            console.error('Background fetch task failed:', error);
          } finally {
            // REQUIRED: Signal to the OS that your task is complete
            BackgroundFetch.finish(taskId);
          }
        },
        error => {
          console.error('[BackgroundFetch] Failed to configure:', error);
        }
      );

      // Force immediate execution
      await BackgroundFetch.start();

      // Execute the task immediately
      const taskId = 'immediate-fetch';
      await BackgroundFetch.scheduleTask({
        taskId,
        delay: 0, // Execute immediately
        periodic: false,
        forceAlarmManager: true, // Force immediate execution
      });

      console.log('[BackgroundFetch] Manual fetch triggered');
    } catch (error) {
      console.error('[BackgroundFetch] configure ERROR:', error);
    }
  };

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
      setUsageUpdateTrigger(prev => prev + 1);
    }
  }, []);

  React.useEffect(() => {
    try {
      // Configure background fetch
      BackgroundFetch.configure(
        {
          minimumFetchInterval: 60, // 1 hour in minutes
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Allow running without network
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresBatteryNotLow: false,
        },
        async taskId => {
          console.log('BackgroundFetch taskId:', taskId);
          try {
            // Check if current time is between 7am and 10pm
            const now = new Date();
            const hours = now.getHours();

            if (hours >= 7 && hours <= 22) {
              // send usage summary to agent
              const { title, body } = await getNotificationSummary();
              await sendInstantNotification(title, body);
            } else {
              console.log('Outside active hours (7am-10pm), skipping notification');
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
    } catch (error) {
      console.error('Error setting up background fetch:', error);
    }

    // Keyboard.addListener('keyboardDidShow', () => {
    //   setActiveContent('chat');
    // });
    refreshUsageData();
  }, []);

  // React.useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       await Promise.all([
  //         refreshTasks(),
  //         refreshMemories(),
  //         refreshUsageData(),
  //       ]);
  //     } catch (error) {
  //       console.error('Error initializing app:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   initializeApp();
  // }, []);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  React.useEffect(() => {
    fetchUsageData();
  }, []);

  const navigateTo = (path: 'tasks' | 'notes' | 'habits' | 'reflections' | '') => {
    router.push(`/${path}`);
  };

  const handleSubmit = async (quickAction?: string) => {
    if (!userResponse && !quickAction) {
      console.log('No results to send');
      return;
    }

    // hide the main container
    setActiveContent('chat');
    talkToAgent(
      userResponse + (quickAction || ''),
      updateMessageHistory,
      messageHistory,
      setAssistantResponse,
      setIsThinking,
      setIsLoading,
      setActiveContent,
      navigateTo
    );
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
      }
    };
  }, []);

  // const scrollToTop = () => {
  //   if (scrollViewRef.current) {
  //     scrollViewRef.current.scrollTo({ y: 1200, animated: true });
  //   }
  // };

  // Add effect to scroll when messages change
  // React.useEffect(() => {
  //   // Small delay to ensure the new message is rendered
  //   setTimeout(scrollToTop, 100);
  // }, [isThinking]);

  // const onMessageRefresh = React.useCallback(async () => {
  //   setRefreshing(true);
  //   clearMessageHistory();
  //   setRefreshing(false);
  // }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {activeContent === 'home' && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Lumi says hi</Text>
            <Ionicons name="sparkles-outline" size={24} color="#000000" />
          </View>

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
        </View>
      )}
      <UsageChart usageData={usageData} />
      {activeContent === 'chat' && <HeartAnimation />}
      {/* <View style={styles.inputContainer}>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onlyRecording={false}
        />
      </View> */}
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
    height: '48%',
    padding: 24,
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
    flex: 1,
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
