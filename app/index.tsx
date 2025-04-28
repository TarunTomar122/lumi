import { useNavigation } from 'expo-router';
import { Text, View, TouchableWithoutFeedback, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { clientTools } from '@/utils/tools';
import { clientToolsSchema } from '@/utils/tools';
import { setupNotifications, scheduleNotification } from '@/utils/tools';
import { db } from '@/utils/database';
import { styles } from './styles/indexStyles';
import LottieView from 'lottie-react-native';
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
  const [assistantResponse, setAssistantResponse] = React.useState<string>(
    'Hii tarat, how can I help you today?'
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [messageHistory, setMessageHistory] = React.useState<Array<any>>([SYSTEM_MESSAGE]);
  const animationRef = React.useRef<LottieView>(null);
  const processedResultsRef = React.useRef<Set<string>>(new Set());
  const resultsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Watch for speech errors and update assistant response
  React.useEffect(() => {
    if (state.error) {
      setAssistantResponse("I couldn't quite understand you. Could you please try speaking again?");
      // Clear the error state after displaying the message
      resetState();
    }
  }, [state.error]);

  React.useEffect(() => {
    const setup = async () => {
      try {
        await setupNotifications();
        animationRef.current?.play(30, 50);
      } catch (error) {
        console.error('Setup error:', error);
      }
    };
    setup();
  }, []);

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
        handleSubmit();
      }
    }
  }, [state.results]);

  const updateMessageHistory = (newMessages: Array<any>) => {
    // Always keep the system message at the start and limit to MAX_HISTORY messages
    const updatedHistory = [SYSTEM_MESSAGE, ...newMessages].slice(0, MAX_HISTORY);
    setMessageHistory(updatedHistory);
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

  const handleFabPress = async () => {
    if (!isRecording) {
      // Clear any existing timeout
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
        resultsTimeoutRef.current = null;
      }

      resetState(); // Reset previous results
      setIsRecording(true);
      await startRecognizing();
      console.log('Started recording');
    } else {
      console.log('Stopping recording - current results:', state.results);
      setIsRecording(false);
      await stopRecognizing();

      // Clear any existing timeout
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current);
      }

      // Set a new timeout to wait for results
      resultsTimeoutRef.current = setTimeout(() => {
        console.log('stopRecording - final results after timeout:', state.results);
        // If we still don't have results, try using partial results
        if (!state.results.length && state.partialResults.length) {
          // Use the first partial result if available
          const partialResult = state.partialResults[0];
          processedResultsRef.current.add(partialResult);
          handleSubmit();
        }
      }, 1000);
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
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.greetingText}>Welcome, </Text>
          <Text style={styles.headerText}>Tarat</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('reminders' as never)}>
          <Ionicons name="alarm-outline" size={32} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.agentTextContainer}
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.agentText}>{assistantResponse}</Text>
        </ScrollView>
      </View>

      <View style={styles.imageContainer}>
        <TouchableWithoutFeedback>
          <LottieView
            ref={animationRef}
            source={require('@/assets/lottiefiles/sloth_floating.json')}
            autoPlay={false}
            loop={true}
            style={styles.image}
          />
        </TouchableWithoutFeedback>
      </View>

      <TouchableOpacity
        style={[styles.fab, isRecording && styles.fabRecording]}
        onPress={handleFabPress}>
        <Ionicons
          name={isRecording ? 'paw' : 'paw-outline'}
          size={40}
          color={isRecording ? '#fff' : '#333'}
        />
      </TouchableOpacity>
    </View>
  );
}
