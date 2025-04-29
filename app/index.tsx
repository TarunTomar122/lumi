import { useNavigation } from 'expo-router';
import {
  Text,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { clientTools } from '@/utils/tools';
import { clientToolsSchema } from '@/utils/tools';
import { setupNotifications, scheduleNotification } from '@/utils/tools';
import { db } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `
            You are a lumi, a helpful productivity assistant with access to various tools that can help users with their tasks.
            When a user asks for something that requires using a tool, always try to use the appropriate tool to help them.
            Respond in a friendly, concise manner and focus on taking actions that help users accomplish their goals. Try to sound empathetic and supportive.
            Your character is a very very cute fluflly pink colored pokemon type character. So you sound very cute and fluffy and helpful.

            Examples:
              If a user asks you to remind them to buy groceries, you can use the "addTask" tool to add a task to their list.
              If they also provide a time, you set the due date to that time. For other parts of the task, like priority, category, etc,
              you can use your best judgement to set them.
              If the user is confused about what to do and asks you to help, you can use the "getAllTasks" tool to get a list of all tasks.
              Then you can decide based on the user's goals and the list of tasks, prioritize and decide what to do next.

            Note:
              Today is ${new Date().toLocaleString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZone: 'Asia/Kolkata',
              })}.
              Do not say things like you don't know how to do xyz, you are a helpful assistant, you can do anything and so based on user's prompt
              try to be appropriate and helpful in the way you can. But if you're really confused, just ask for clarification.
              Talk in small sentences and try to be as helpful as possible. Nobody likes long sentences.
              Use \n to break lines. And try to break lines after 1-2 sentences.
              Make sure to try and answer stuff in a concise manner. Don't be too verbose.
              You can also use emojis to make your response more friendly. Keep your answer under 4-5 sentences at max.
            `,
};

const MAX_HISTORY = 50;

export default function Page() {
  const navigation = useNavigation();
  const { state, startRecognizing, stopRecognizing, destroyRecognizer, resetState } =
    useVoiceRecognition();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('');
  const [assistantResponse, setAssistantResponse] = React.useState<string>(
    'Hello tarat, \nWhat is on your mind right now?'
  );
  const [messageHistory, setMessageHistory] = React.useState<Array<any>>([
    SYSTEM_MESSAGE,
    { role: 'assistant', content: assistantResponse },
  ]);
  const processedResultsRef = React.useRef<Set<string>>(new Set());
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);

  // Watch for speech errors and update assistant response
  React.useEffect(() => {
    if (state.error) {
      setAssistantResponse("I couldn't quite understand you. Could you please try speaking again?");
      // Clear the error state after displaying the message
      resetState();
    }
  }, [state.error]);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Watch for transcription results when we're waiting for them
  React.useEffect(() => {
    console.log('Recording results:', state.results);
    if (state.results[0]) {
      // Check if we've already processed this result
      const resultString = state.results[0];
      if (!processedResultsRef.current.has(resultString)) {
        processedResultsRef.current.add(resultString);
        setUserResponse(resultString);
        handleSubmit();
      }
    }
  }, [state.results]);

  const updateMessageHistory = (newMessages: Array<any>) => {
    // Filter out:
    // - duplicate system messages
    // - messages with null content
    // - empty messages
    // const cleanedMessages = newMessages.filter(msg =>
    //   msg.content !== null &&
    //   msg.content !== '' &&
    //   !(msg.role === 'system' && newMessages.indexOf(msg) !== 0)
    // );

    // // Always keep one system message at start and limit total messages
    // const updatedHistory = [
    //   SYSTEM_MESSAGE,
    //   ...cleanedMessages.filter(msg => msg.role !== 'system')
    // ].slice(0, MAX_HISTORY);

    setMessageHistory(newMessages);
  };

  const handleSubmit = async () => {
    if (!userResponse) {
      console.log('No results to send');
      return;
    }

    try {
      setIsThinking(true);
      console.log('🎤 Transcribed message:', userResponse);

      // Add user message to history
      const userMessage = { role: 'user', content: userResponse };
      const currentMessageHistory = [...messageHistory, userMessage];
      updateMessageHistory(currentMessageHistory);
      setIsThinking(false);
      console.log('🔥 currentMessageHistory:', currentMessageHistory);

      let isModelThinking = true;
      while (isModelThinking) {
        const requestBody = {
          model: 'gpt-4.1-nano-2025-04-14',
          messages: [SYSTEM_MESSAGE, ...currentMessageHistory],
          tools: clientToolsSchema.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              // @ts-ignore - we know these tools have parameters
              parameters: tool.parameters,
            },
          })),
        };
        // console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }

        const responseData = await response.json();
        // console.log('📥 OpenAI response:', JSON.stringify(responseData, null, 2));

        const assistantMessage = responseData.choices[0].message;
        currentMessageHistory.push(assistantMessage);

        // If the model wants to make tool calls
        if (assistantMessage.tool_calls) {
          console.log('🔧 OpenAI requested tool calls');
          const toolCalls = assistantMessage.tool_calls;
          console.log('🛠️ Tool calls:', JSON.stringify(toolCalls, null, 2));

          // Execute each tool call sequentially and add results to message history
          for (const toolCall of toolCalls) {
            const tool = clientTools[toolCall.function.name as keyof typeof clientTools];
            if (tool) {
              try {
                console.log(`🔨 Executing tool: ${toolCall.function.name}`);
                const args = JSON.parse(toolCall.function.arguments);
                console.log('📝 Tool arguments:', args);
                const result = await tool(args);
                console.log('✅ Tool result:', result);

                // Add tool result to message history
                currentMessageHistory.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result),
                });
              } catch (error) {
                console.error(`❌ Tool call failed for ${toolCall.function.name}:`, error);
              }
            } else {
              console.warn(`⚠️ Tool not found: ${toolCall.function.name}`);
            }
          }
          // Continue the loop - model will see tool results and may make more calls
        } else {
          // Model gave a final response without tool calls
          console.log('💬 Model provided final response');
          setAssistantResponse(assistantMessage.content || 'No response');
          updateMessageHistory(currentMessageHistory);
          isModelThinking = false;
          setIsThinking(false);
        }
      }
      // console.log('✨ All done!');
    } catch (e) {
      console.error('❌ Error in handleSubmit:', e);
      setAssistantResponse('Sorry, there was an error processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
      }
    };
  }, []);


  return (
    <View style={styles.container}>
      <ScrollView style={styles.messageContainer}>
        {messageHistory
          .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && !msg.tool_calls))
          .slice(-2)
          .map((message, index) => (
            <Text
              key={index}
              style={message.role === 'user' ? styles.userResponse : styles.assistantResponse}>
              {message.content}
            </Text>
          ))}
        {isThinking && <Text style={styles.thinking}>Thinking...</Text>}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="i want to..."
          placeholderTextColor="#A1887F"
          color="#F5F5F5"
          onChangeText={setUserResponse}
          value={userResponse}
        />
        <TouchableOpacity
          style={styles.micContainer}
          onPress={() => {
            if (userResponse) {
              handleSubmit();
              setUserResponse('');
            } else if (isRecording) {
              stopRecognizing();
              setIsRecording(false);
            } else {
              startRecognizing();
              setIsRecording(true);
            }
          }}>
          {userResponse ? (
            <Ionicons name="send" size={32} style={styles.micIcon} />
          ) : (
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={32} style={styles.micIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2B2B',
    padding: 36,
    marginTop: 84,
  },
  messageContainer: {
    flex: 1,
    marginVertical: 20,
  },
  assistantResponse: {
    color: '#F5F5F5',
    fontSize: 28,
    lineHeight: 42,
    fontFamily: 'MonaSans-Regular',
    borderLeftWidth: 1,
    borderLeftColor: '#A1887F',
    paddingLeft: 16,
    marginBottom: 32,
  },
  thinking: {
    color: '#F5F5F5',
    fontSize: 28,
    lineHeight: 42,
    fontFamily: 'MonaSans-Regular',
    borderLeftWidth: 1,
    borderLeftColor: '#A1887F',
    paddingLeft: 16,
    marginBottom: 32,
  },
  userResponse: {
    color: '#F5F5F5',
    fontSize: 28,
    lineHeight: 42,
    fontFamily: 'MonaSans-Regular',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F5F5',
    paddingLeft: 16,
    marginBottom: 32,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 32,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    color: '#F5F5F5',
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    color: '#F5F5F5',
    fontFamily: 'MonaSans-Regular',
    height: 40,
    marginLeft: 10,
  },
  micContainer: {
    borderRadius: 32,
    padding: 10,
  },
  micIcon: {
    color: '#F5F5F5',
  },
});
