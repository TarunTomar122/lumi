import { useNavigation } from 'expo-router';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Message from './components/Message';
import { talkToAgent } from '@/utils/agent';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
import { useTaskStore } from './store/taskStore';
import { useMemoryStore } from './store/memoryStore';
import InfoContainer from './components/InfoContainer';
const MAX_HISTORY = 50;

import { getLastDayUsageStats, checkUsagePermission } from '@/utils/usageStats';

export default function Page() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('');
  const [assistantResponse, setAssistantResponse] = React.useState<string>(
    ''
  );
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const { tasks, refreshTasks } = useTaskStore();
  const { memories, refreshMemories } = useMemoryStore();
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const [activeContent, setActiveContent] = React.useState<string>('chat');

  React.useEffect(() => {
    refreshTasks();
    refreshMemories();

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
        setIsLoading
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
    talkToAgent(
      userResponse + (quickAction || ''),
      updateMessageHistory,
      messageHistory,
      setAssistantResponse,
      setIsThinking,
      setIsLoading
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (activeContent === 'tasks') {
      await refreshTasks();
    } else if (activeContent === 'memories') {
      await refreshMemories();
    }
    setRefreshing(false);
  }, [activeContent]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#000000" />
          </TouchableOpacity>
          <View style={styles.appTitle}>
            <Text style={styles.appTitleText}>Lumi</Text>
            <Ionicons name="sparkles-outline" size={24} color="#000000" />
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => {}}>
            <Ionicons name="person-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.TabsContainer}>
          <TouchableOpacity
            style={
              activeContent === 'chat'
                ? styles.ContentHeaderButtonActive
                : styles.ContentHeaderButton
            }
            onPress={() => setActiveContent('chat')}>
            <Text
              style={
                activeContent === 'chat' ? styles.ContentHeaderTextActive : styles.ContentHeaderText
              }>
              Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={
              activeContent === 'tasks'
                ? styles.ContentHeaderButtonActive
                : styles.ContentHeaderButton
            }
            onPress={() => {
              setActiveContent('tasks');
              refreshTasks();
            }}>
            <Text
              style={
                activeContent === 'tasks'
                  ? styles.ContentHeaderTextActive
                  : styles.ContentHeaderText
              }>
              Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={
              activeContent === 'memories'
                ? styles.ContentHeaderButtonActive
                : styles.ContentHeaderButton
            }
            onPress={() => {
              setActiveContent('memories');
              refreshMemories();
            }}>
            <Text
              style={
                activeContent === 'memories'
                  ? styles.ContentHeaderTextActive
                  : styles.ContentHeaderText
              }>
              Notes
            </Text>
          </TouchableOpacity>
        </View>

        {activeContent === 'chat' && (
          <View style={styles.messagesWrapper}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onMessageRefresh} />
              }
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
        )}
        {activeContent === 'tasks' && (
          <ScrollView
            style={styles.TasksListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <InfoContainer items={tasks} />
          </ScrollView>
        )}
        {activeContent === 'memories' && (
          <ScrollView
            style={styles.TasksListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <InfoContainer items={memories} />
          </ScrollView>
        )}
      </View>
      {activeContent === 'chat' && (
        <View style={styles.inputContainer}>
          <InputContainer
            userResponse={userResponse}
            setUserResponse={setUserResponse}
            handleSubmit={handleSubmit}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 30,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 22,
  },
  menuButton: {
    padding: 0,
  },
  appTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  appTitleText: {
    color: '#000000',
    fontSize: 24,
    fontFamily: 'MonaSans-Bold',
  },
  profileButton: {
    padding: 8,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 16,
    left: 8,
    right: 8,
    padding: 8,
  },
  messageContainer: {
    flex: 1,
    marginBottom: 64,
  },
  messageContentContainer: {
    paddingBottom: 40, // Add padding at the bottom for better spacing when scrolled to top
  },
  messagesWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
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
  TasksListView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  TabsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#000000',
    borderRadius: 128,
    alignItems: 'center',
    padding: 10,
    width: '90%',
    marginLeft: '5%',
    marginBottom: 32,
  },
  ContentHeaderButton: {
    backgroundColor: '#000000',
    borderRadius: 32,
    padding: 12,
    paddingHorizontal: 24,
  },
  ContentHeaderButtonActive: {
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 64,
  },
  ContentHeaderText: {
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
    color: '#ffffff',
  },
  ContentHeaderTextActive: {
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  TasksListContainer: {
    flex: 1,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
});
