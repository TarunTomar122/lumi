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
} from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Message from './components/Message';
import { talkToAgent } from '@/utils/agent';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
import { useTaskStore } from './store/taskStore';
import { useMemoryStore } from './store/memoryStore';
import HomeCard from './components/HomeCard';
const MAX_HISTORY = 50;

import { getLastDayUsageStats, checkUsagePermission } from '@/utils/usageStats';

export default function Page() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('');
  const [assistantResponse, setAssistantResponse] = React.useState<string>('');
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const { tasks, refreshTasks } = useTaskStore();
  const { memories, refreshMemories } = useMemoryStore();
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const [activeContent, setActiveContent] = React.useState<string>('home');

  React.useEffect(() => {
    try {
      refreshTasks();
      refreshMemories();
    } catch (error) {
      console.error(error);
    }

    Keyboard.addListener('keyboardDidShow', () => {
      setActiveContent('chat');
    });

    const fetchUsageStats = async () => {
      const hasPermission = await checkUsagePermission();
      console.log('hasPermission:', hasPermission);
      if (!hasPermission) {
        return;
      }
      const usageStats = await getLastDayUsageStats();

      // send the usageStats to the model and get a response
      const promptForModel = `
        App Usage Stats:
        The user has used the following apps today: ${JSON.stringify(usageStats)}.
        Please analyze the usage stats and provide a response to the user that might be helpful to them. But keep it short and concise.
        Not more than 50 words. And include the time spent (in minutes) in the top app if that could be helpful. Don't give a display_message for this message.
      `;

      await talkToAgent(
        promptForModel,
        updateMessageHistory,
        messageHistory,
        setAssistantResponse,
        setIsThinking,
        setIsLoading,
        setActiveContent
      );
    };
    // fetchUsageStats();
  }, []);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
      setActiveContent
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

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 1200, animated: true });
    }
  };

  // Add effect to scroll when messages change
  React.useEffect(() => {
    // Small delay to ensure the new message is rendered
    setTimeout(scrollToTop, 100);
  }, [isThinking]);

  const onMessageRefresh = React.useCallback(async () => {
    setRefreshing(true);
    clearMessageHistory();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={activeContent === 'home' ? styles.container : { display: 'none' }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>hello,</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>tarat</Text>
            <Ionicons name="sparkles-outline" size={24} color="#000000" />
          </View>
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
          <View style={[styles.row, styles.disabledRow]}>
            <HomeCard
              title="Habits"
              icon="bar-chart-outline"
              onPress={() => {
                router.push('/habits');
              }}
              disabled={true}
            />
            <HomeCard
              title="Reflections"
              icon="calendar-outline"
              onPress={() => {
                router.push('/reflections');
              }}
              disabled={true}
            />
          </View>
        </View>
      </View>
      <View style={activeContent === 'chat' ? styles.agentChatContainer : { display: 'none' }}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatHeaderText}>Chat</Text>
          <TouchableOpacity onPress={() => setActiveContent('home')}>
            <Ionicons name="close-outline" size={32} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.messagesWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onMessageRefresh} />}
            contentContainerStyle={styles.messageContentContainer}>
            {messageHistory
              .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && !msg.tool_calls))
              .slice(-MAX_HISTORY)
              .map((message, index) => (
                <Message message={message} key={index} />
              ))}
            {isThinking && <Text style={styles.thinking}>Thinking...</Text>}
          </ScrollView>
        </View>
      </View>
      <View style={styles.inputContainer}>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    padding: 32,
  },
  agentChatContainer: {
    flex: 1,
    padding: 32,
  },
  inputContainer: {
    padding: 32,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
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
    fontSize: 28,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontFamily: 'MonaSans-Bold',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 'auto',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  searchIcon: {
    marginLeft: 8,
  },
  messageContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  welcomeText: {
    color: '#F5F5F5',
    fontSize: 32,
    fontFamily: 'MonaSans-Regular',
    marginBottom: 24,
  },
  thinking: {
    color: '#A1887F',
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    fontStyle: 'italic',
    marginBottom: 16,
  },
});
