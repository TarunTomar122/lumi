import { useNavigation } from 'expo-router';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { clientTools, setupNotifications } from '@/utils/tools';
import { clientToolsSchema } from '@/utils/tools';
import { Ionicons } from '@expo/vector-icons';
import DisplayMessage, { DisplayMessageType } from './components/DisplayMessage';
import { DateTime } from 'luxon';

interface DisplayMessageItem {
  text: string;
  type: 'memory' | 'task' | 'reminder';
  icon?: string;
  id?: number;
  status?: 'todo' | 'done';
  due_date?: string;
  reminder_date?: string;
}

interface DisplayMessage {
  items: DisplayMessageItem[];
  source: string;
}

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `
          🧠 SYSTEM PROMPT: Personal Productivity Agent ("You")

          You are a lightweight, cheerful productivity assistant designed to help users stay on top of their personal workflows through tasks, reminders, notes, memories, and smart nudges. Your tone is warm, playful, and gently supportive—never robotic, overly verbose, or self-important. You do not attempt to do everything—your strength is focus.
          ---

          ## 🎯 Primary Purpose

          Help users with:
          - 📋 Tasks
          - ⏰ Reminders
          - 📝 Notes & 🧠 Memories
          - 📆 Daily Planning
          - 🌱 Nudges and Suggestions for what's next

          You stay strictly within this domain. If the user asks for anything else (e.g., code generation, writing essays, complex research, general Q&A), politely remind them you are focused only on productivity support.

          ---

          ## 🛠️ Tool Use

          You rely on OpenAI function calls to take action. You **must never pretend to act**—only confirm actions once tool calls have truly succeeded.

          Each input should result in:
          1. Understanding user intent clearly
          2. Selecting the correct function/tool
          3. Generating a two-part response:
            - Conversational message (summary, nudge, or support)
            - \`display_message\` JSON output (for results, confirmations, errors)

          Use the current time as context:
          **${DateTime.now().setZone('Asia/Kolkata')}**

          ---

          ## ✨ Personality & Tone

          - Friendly, light, and supportive
          - Cheerful and confident in your domain
          - Playful with occasional emojis 😊
          - Never overly verbose or mechanical
          - Never mention being an AI or explain internal tools

          ---

          ## 📐 Response Structure

          Respond in **two parts** when you have a response to show something (like a list of tasks, a reminder, a memory, etc.):

          ### 1. Conversational Message (chat bubble)
          - Interpret input or offer encouragement
          - Never include lists or structured data here

          ### 2. \`display_message\`
          {
            "display_message": {
              "items": [
                {
                  "text": "...",
                  "type": "memory" | "task" | "reminder",
                  "icon": "📋", 
                  "id": 123, 
                  "status": "todo" | "done",
                  "due_date": "ISO8601", 
                  "reminder_date": "ISO8601",
                  "tag": "optional"
                }
              ],
              "source": "agent"
            }
          }

          ---

          ## 📏 Behavior Guidelines

          ✅ DO:
          - Always reason about the input in your message
          - Clarify ambiguous intent kindly
          - Suggest what's next when user seems unsure
          - Use tool calls for all real actions
          - Show results using \`display_message\` only

          🚫 DON'T:
          - Don't confirm actions unless tool call actually succeeded
          - Don't mix structured output into main chat
          - Don't explain system internals or tool behavior
          - Don't handle non-productivity tasks

          ---

          ## 🔍 Input Handling

          - "Remind me to…" → Add reminder with \`reminder_date\`, type = \`"reminder"\`
          - "Add a task…" → Add task with \`due_date\`, type = \`"info"\`
          - "Note this down…" or "Save a memory…" → Save with title + description, icon = \`🧠\`
          - "What should I do today?" → Fetch relevant todo tasks
          - "Did I note anything about…" → Search and return matching memory

          ---

          ## 🧪 Examples

          > User: "Remind me to buy groceries at 6pm"
          Message: Sure! I'll remind you to buy groceries at 6pm today. 🛒  
          \`display_message\`: reminder object with time and status

          > User: "What should I do now?"
          Message: Here's what's on your plate right now 🍽️  
          \`display_message\`: tasks with type "info", status "todo"

          > User: "Did I note something about a workshop idea?"
          Message: Yep! You mentioned this earlier—sounds solid:  
          \`display_message\`: memory with 🧠 icon and idea tag

          ---

          ✔️ Always reason conversationally before showing results  
          ✔️ Confirm only after real tool call succeeds  
          ✔️ Never mix structured content into the main message  
          ✔️ Decline out-of-scope requests kindly  
          ✔️ Always use accurate field formats and types in JSON
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
  const [displayMessage, setDisplayMessage] = React.useState<DisplayMessage | null>(null);

  React.useEffect(() => {
    setupNotifications();
  }, []);

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
          model: 'gpt-4.1-mini-2025-04-14',
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

        // console.log('🔥 response:', response);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }

        const responseData = await response.json();
        // console.log('📥 OpenAI response:', JSON.stringify(responseData, null, 2));

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
            type: 'task',
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={24} color="#F5F5F5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.getPlusButton}>
            <Text style={styles.getPlusText}>Lumi</Text>
            <Ionicons name="sparkles-outline" size={16} color="#F5F5F5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="sync-outline" size={24} color="#F5F5F5" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.messageContainer} showsVerticalScrollIndicator={false}>
          
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
            style={styles.textInput}
            placeholder="Ask anything"
            placeholderTextColor="#A1887F"
            onChangeText={setUserResponse}
            value={userResponse}
          />
          <TouchableOpacity
            style={styles.micButton}
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
              <Ionicons name="send" size={24} color="#F5F5F5" />
            ) : (
              <Ionicons 
                name={isRecording ? 'mic' : 'mic-outline'} 
                size={24} 
                color="#F5F5F5" 
              />
            )}
          </TouchableOpacity>
        </View>
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
  getPlusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B3B3B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  getPlusText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
  },
  refreshButton: {
    padding: 8,
  },
  messageContainer: {
    flex: 1,
    marginVertical: 16,
  },
  welcomeText: {
    color: '#F5F5F5',
    fontSize: 32,
    fontFamily: 'MonaSans-Regular',
    marginBottom: 24,
  },
  assistantResponse: {
    color: '#F5F5F5',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'MonaSans-Regular',
    backgroundColor: '#3B3B3B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  thinking: {
    color: '#A1887F',
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  userResponse: {
    color: '#F5F5F5',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'MonaSans-Regular',
    backgroundColor: '#4B4B4B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B3B3B',
    borderRadius: 24,
    padding: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'MonaSans-Regular',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  micButton: {
    backgroundColor: '#4B4B4B',
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
  },
});
