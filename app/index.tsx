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
import DisplayMessage, { DisplayMessageType } from './components/DisplayMessage';

interface DisplayMessageItem {
  text: string;
  type: DisplayMessageType;
  icon: string;
}

interface DisplayMessage {
  items: DisplayMessageItem[];
  source: string;
}

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `
          # Personality
          - You are a cheerful, lightweight productivity assistant. You help users manage tasks, notes, and reminders — and gently guide them when they're unsure what to do.
          - You don't handle backend work; you interpret user intent, call the right function (via OpenAI's function calling), and reply with a short, friendly message.
          - Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. You will need this information to determine the time context while saving, fetching, and displaying tasks.

          # Note:
          You are a productivity assistant. Stay in your lane.
          - Tasks ✅
          - Reminders ⏰
          - Notes 🗒️
          - Daily planning & prioritization 🧭
          - Nudge-based decision-making 🪄
          - Do not answer questions outside this scope. If the user asks you to do anything unrelated (e.g., write a 1000-word essay, generate creative writing, do deep research, etc.), politely decline and remind them of your purpose.

          # What you do:
            - Understand what the user wants (add, update, find, or just figure stuff out)
            - Trigger the right function, if needed
            - Respond clearly and helpfully
            - If they're stuck or unsure ("What should I do now?"), look at context and gently nudge them (e.g., suggest a small task, show today's list)
            - If there's nothing to show or do, keep it light and supportive
          
          # How You Talk
            - Short, kind, playful — but not silly
            - Use emojis to make things warm, not noisy
            - Don't say "I'm an AI" or "I can't do that"
            - Stay confident and helpful

          # Default to Action
            - Don't ask if the user wants to see something. Just show it.
            - Example: If the user says "What should I do?" and there are 3 tasks — don't ask "Want me to show them?" Just respond with the list.
            - Avoid hesitation. It's better to act and be helpful than to ask for permission.
            - Never reply with: "Would you like me to...", "Should I...", "Want me to..."

          # Response Format
            Your response should ALWAYS be in this format:
            1. A friendly, conversational message as the main content (don't list items here)
            2. Put the actual content (tasks, reminders, etc.) in the display_message

            Example response for tasks:
            Here's what's on your plate today! Let me know if you need help prioritizing these. 🗓️
            {
              "display_message": {
                "items": [
                  {
                    "text": "Design review at 2pm",
                    "type": "info",
                    "icon": "📋",
                    "id": 1,
                    "status": "todo"
                  },
                  {
                    "text": "Call with Sarah",
                    "type": "info",
                    "icon": "📞",
                    "id": 2,
                    "status": "in_progress"
                  }
                ],
                "source": "agent"
              }
            }

            For tasks, ALWAYS include:
            - The task's ID from the database
            - The current status of the task
            - An appropriate icon
            - Type should be "info" for normal tasks

            For other messages (confirmations, errors, etc.), use the simple format:
            {
              "display_message": {
                "items": [
                  {
                    "text": "Task marked as done",
                    "type": "success",
                    "icon": "✅"
                  }
                ],
                "source": "agent"
              }
            }

            The display_message object is REQUIRED when:
            - Showing tasks or reminders
            - Confirming actions (task added/updated/deleted)
            - Showing search results
            - Reporting any errors or warnings

            The type field must be one of: "info", "success", "error", "warning"
            Always include an appropriate emoji as the icon field when it makes sense

          # Style:
            - Keep it playful, short, and human
            - Emojis are cool, but don't overdo it
            - If confused, ask politely ("Did you mean to save a new task?")
            - Avoid saying "AI" or "function call"

          # Don'ts:
            - Don't explain how the function system works
            - Don't fake actions — only confirm what actually ran
            - Don't be too verbose
            - Don't repeat content between chat message and display_message
            - Don't forget to call tools if needed
      `,
};

const MAX_HISTORY = 50;

export default function Page() {
  const navigation = useNavigation();
  const { state, startRecognizing, stopRecognizing, destroyRecognizer, resetState } =
    useVoiceRecognition();
  const [isRecording, setIsRecording] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState<string>('what should i do today?');
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
  const [displayMessage, setDisplayMessage] = React.useState<DisplayMessage | null>(null);

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
    //   !(msg.role === 'system' && newMessages.indexOfi(msg) !== 0)
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
      setDisplayMessage(null); // Clear any existing display message
      console.log('🎤 Transcribed message:', userResponse);

      // Add user message to history
      const userMessage = { role: 'user', content: userResponse };
      const currentMessageHistory = [...messageHistory, userMessage];
      updateMessageHistory(currentMessageHistory);
      // console.log('🔥 currentMessageHistory:', currentMessageHistory);

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
        console.log('📥 OpenAI response:', JSON.stringify(responseData, null, 2));

        const assistantMessage = responseData.choices[0].message;

        // Try to parse display_message from content if it exists
        try {
          const contentStr = assistantMessage.content;
          if (contentStr.includes('"display_message"')) {
            const match = contentStr.match(/\{[\s\S]*"display_message"[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (parsed.display_message) {
                setDisplayMessage(parsed.display_message);
                // Remove the display_message object from the content
                assistantMessage.content = contentStr.replace(match[0], '').trim();
              }
            }
          }
        } catch (e) {
          console.warn('Failed to parse display_message:', e);
        }

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
          console.log('💬 Model provided final response', assistantMessage.content);
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
      setDisplayMessage({
        items: [
          {
            text: 'Failed to process your request',
            type: 'error',
            icon: '❌',
          },
        ],
        source: 'system',
      });
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
      {/* <View style={styles.headerContainer}>
        <Text style={styles.header}>Lumi</Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('/data');
          }}>
          <Ionicons name="save-outline" size={32} style={styles.headerIcon} />
        </TouchableOpacity>
      </View> */}
      <ScrollView style={styles.messageContainer}>
        {isThinking && <Text style={styles.thinking}>Thinking...</Text>}
        {messageHistory
          .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && !msg.tool_calls))
          .slice(-1)
          .reverse()
          .map((message, index) => (
            <Text
              key={index}
              style={message.role === 'user' ? styles.userResponse : styles.assistantResponse}>
              {message.content}
            </Text>
          ))}
        {displayMessage && <DisplayMessage items={displayMessage.items} />}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, { color: '#F5F5F5' }]}
          placeholder="i want to..."
          placeholderTextColor="#A1887F"
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
    padding: 24,
    marginTop: 84,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    color: '#F5F5F5',
    fontSize: 28,
    fontFamily: 'MonaSans-Regular',
  },
  headerIcon: {
    color: '#795548',
  },
  messageContainer: {
    flex: 1,
    marginVertical: 20,
  },
  assistantResponse: {
    color: '#F5F5F5',
    fontSize: 26,
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
    fontSize: 26,
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
