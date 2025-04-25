import { useNavigation } from 'expo-router';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { clientTools } from '@/utils/tools';
import { clientToolsSchema } from '@/utils/tools';
import { SvgXml } from 'react-native-svg';

import { useAuth } from '@/hooks/useAuth';

import { setupNotifications, scheduleNotification } from '@/utils/tools';

const ohwFaceSvg = `
  <svg width="144" height="144" viewBox="0 0 144 144" fill="#DBDDE6" xmlns="http://www.w3.org/2000/svg">
    <circle cx="72" cy="72" r="70.5" stroke="black" stroke-width="3"/>
    <circle cx="43" cy="51" r="7" fill="black"/>
    <circle cx="104" cy="51" r="7" fill="black"/>
    <path d="M72.5 92C78.5411 92 83 95.7961 83 100C83 104.204 78.5411 108 72.5 108C66.4589 108 62 104.204 62 100C62 95.7961 66.4589 92 72.5 92Z" stroke="black" stroke-width="2" fill="black"/>
  </svg>
`;

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
              Also you can use the "getBusySlots" tool to get the busy slots for the current user for a given date while scheduling a reminder automatically 
              for the task.
            
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
            `,
};

const MAX_HISTORY = 50;

export default function Home() {
  const navigation = useNavigation();
  const { state, startRecognizing, stopRecognizing, destroyRecognizer } = useVoiceRecognition();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [assistantResponse, setAssistantResponse] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [pendingSubmit, setPendingSubmit] = React.useState(false);
  const [messageHistory, setMessageHistory] = React.useState<Array<any>>([SYSTEM_MESSAGE]);

  React.useEffect(() => {
    setupNotifications();
  }, []);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Watch for transcription results when we're waiting for them
  React.useEffect(() => {
    if (pendingSubmit && state.results[0]) {
      setPendingSubmit(false);
      handleSubmit();
    }
  }, [state.results, pendingSubmit]);

  const updateMessageHistory = (newMessages: Array<any>) => {
    // Always keep the system message at the start and limit to MAX_HISTORY messages
    const updatedHistory = [SYSTEM_MESSAGE, ...newMessages].slice(0, MAX_HISTORY);
    setMessageHistory(updatedHistory);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      await stopRecognizing();
      setPendingSubmit(true); // Mark that we're waiting for results
    } else {
      // Start recording
      setIsRecording(true);
      startRecognizing();
    }
  };

  const handleSubmit = async () => {
    if (!state.results[0]) {
      console.log('No results to send');
      return;
    }
    const message = state.results[0];
    try {
      setIsLoading(true);
      console.log('🎤 Transcribed message:', message);

      // Add user message to history
      const userMessage = { role: 'user', content: message };
      let currentMessageHistory = [...messageHistory.slice(1), userMessage];
      updateMessageHistory(currentMessageHistory);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <SvgXml xml={ohwFaceSvg} width="200" height="200" />
        </View>

        <Text style={styles.welcomeText}>Welcome, {user?.displayName}!</Text>
         {assistantResponse && <Text style={styles.responseText}>{assistantResponse}</Text>}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={handleToggleRecording}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                  isRecording && styles.buttonRecording,
                ]}
                disabled={isLoading}>
                <Text style={styles.buttonText}>
                  {isLoading ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  responseText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonRecording: {
    backgroundColor: '#ff0000',
  },
  signOutButton: {
    backgroundColor: '#666',
  },
  calendarButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#4285F4',
  },
});
