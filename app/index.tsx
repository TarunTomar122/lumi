import { useNavigation } from 'expo-router';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Message from './components/Message';
import { talkToAgent } from '@/utils/agent';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
const MAX_HISTORY = 50;

export default function Page() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('');
  const [assistantResponse, setAssistantResponse] = React.useState<string>(
    'Hello tarat, \nWhat is on your mind right now?'
  );
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

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

  const handleAddTaskQuickAction = () => {
    setUserResponse('Add a task:');
  };

  const handleGetNotesQuickAction = () => {
    handleSubmit('Get notes');
  };

  const handleGetTasksQuickAction = () => {
    handleSubmit('List tasks');
  };

  // Add effect to scroll when messages change
  React.useEffect(() => {
    // Small delay to ensure the new message is rendered
    setTimeout(scrollToTop, 100);
  }, [isThinking]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={24} color="#F5F5F5" />
          </TouchableOpacity>
          <View style={styles.appTitle}>
            <Text style={styles.appTitleText}>Lumi</Text>
            <Ionicons name="sparkles-outline" size={16} color="#F5F5F5" />
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setUserResponse('');
              setAssistantResponse('Hello tarat, \nWhat is on your mind right now?');
              clearMessageHistory();
            }}>
            <Ionicons name="sync-outline" size={24} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messageContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageContentContainer}>
          {messageHistory
            .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && !msg.tool_calls))
            .slice(-MAX_HISTORY)
            .map((message, index) => (
              <Message message={message} key={index} />
            ))}
          {isThinking && <Text style={styles.thinking}>Thinking...</Text>}
        </ScrollView>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText} onPress={handleAddTaskQuickAction}>
              Add Task
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText} onPress={handleGetTasksQuickAction}>
              List Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText} onPress={handleGetNotesQuickAction}>
              Get Notes
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#2B2B2B',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
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
    color: '#F5F5F5',
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
  },
  refreshButton: {
    padding: 8,
  },
  messageContainer: {
    flex: 1,
    marginVertical: 16,
    marginBottom: 32,
  },
  messageContentContainer: {
    paddingBottom: 40, // Add padding at the bottom for better spacing when scrolled to top
  },
  messagesWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 40, // Add some padding at the top for better spacing
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
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  quickActionButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 8,
  },
  quickActionButtonText: {
    color: '#F5F5F5',
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
  },
});
