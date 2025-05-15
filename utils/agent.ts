import { SYSTEM_MESSAGE } from './system-message';
import { clientTools, clientToolsSchema } from './tools';
import { useTaskStore } from '@/app/store/taskStore';
import { useMemoryStore } from '@/app/store/memoryStore';
export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export const talkToAgent = async (
  userResponse: string,
  updateHistory: (messages: Message[]) => void,
  messageHistory: Message[],
  setAssistantResponse: (response: string) => void,
  setIsThinking: (thinking: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  setActiveContent: (content: string) => void,
  navigateTo: (path: 'tasks' | 'notes' | 'habits' | 'reflections' | '') => void
) => {
  const userMessage: Message = { role: 'user', content: userResponse };
  const currentMessageHistory = [...messageHistory, userMessage];
  updateHistory(currentMessageHistory);

  let alreadyNavigated = false;

  try {
    setIsThinking(true);
    setActiveContent('chat');
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

      const assistantMessage = responseData.choices[0].message;
      currentMessageHistory.push(assistantMessage as Message);

      // If the model wants to make tool calls
      if (assistantMessage.tool_calls) {
        // console.log('🔧 OpenAI requested tool calls');
        const toolCalls = assistantMessage.tool_calls;
        // console.log('🛠️ Tool calls:', JSON.stringify(toolCalls, null, 2));

        // Execute each tool call sequentially and add results to message history
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name as keyof typeof clientTools;
          const tool = clientTools[functionName];
          if (tool) {
            try {
              // console.log(`🔨 Executing tool: ${functionName}`);
              const args = JSON.parse(toolCall.function.arguments);
              // console.log('📝 Tool arguments:', args);
              const result = await tool(args);
              // console.log('✅ Tool result:', result);

              // Update stores based on the tool call
              if (result.success) {
                if (
                  functionName === 'addMemory' ||
                  functionName === 'updateMemory' ||
                  functionName === 'deleteMemory' ||
                  functionName === 'getAllMemories'
                ) {
                  const memoryStore = useMemoryStore.getState();
                  await memoryStore.refreshMemories();
                  navigateTo('notes');
                  alreadyNavigated = true;
                } else if (
                  functionName === 'addTask' ||
                  functionName === 'updateTask' ||
                  functionName === 'deleteTask' ||
                  functionName === 'getAllTasks'
                ) {
                  const taskStore = useTaskStore.getState();
                  await taskStore.refreshTasks();
                  navigateTo('tasks');
                  alreadyNavigated = true;
                }
              }

              // Add tool result to message history
              currentMessageHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              } as Message);
            } catch (error) {
              console.error(`❌ Tool call failed for ${functionName}:`, error);
            }
          } else {
            console.warn(`⚠️ Tool not found: ${functionName}`);
          }
        }
        // Continue the loop - model will see tool results and may make more calls
      } else {
        if (!alreadyNavigated) {
          navigateTo('');
        }
        // Model gave a final response without tool calls
        // console.log('💬 Model provided final response', assistantMessage.content);
        setAssistantResponse(assistantMessage.content || 'No response');
        updateHistory(currentMessageHistory);
        isModelThinking = false;
        setIsThinking(false);
      }
    }
  } catch (error) {
    console.error('❌ Error in talkToAgent:', error);
    setAssistantResponse('An error occurred while talking to the agent.');
    setIsThinking(false);
  } finally {
    setIsLoading(false);
  }
};

export const getNotificationSummary = async () => {
  try {
    console.log('Getting notification summary');
    let isModelThinking = true;
    const localMessageHistory = [
      SYSTEM_MESSAGE,
      {
        role: 'user',
        content: `
                  Hey Lumi! I want you to get the usage stats of the apps in my device and also my task list and I want you to create a
                  notification for me that can remind me to be more productive.

                  #### Examples
                  -> "You've used Instagram for over 2 hours today 😲 which is a lot. How about we focus on cleaning the room for a while now?"
                  -> "Your youtube usage is too high today. How about we focus on coding for a while now?"
                  -> "You've been on calls for over 3 hours today. How about we focus on coding for a while now?"

                  #### RESPONSE FORMAT ####
                  Your response should be 1 part and it should be in the following JSON format: 
                  {
                    "title": "string",
                    "body": "string"
                  }
                  The title should be a short title for the notification and the body should be the body of the notification.

                  ### Note
                  Notification title should be not more than 10 characters.
                  Notification body should be not more than 30 characters.
                `,
      },
    ];
    while (isModelThinking) {
      // send usage summary to agent
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini-2025-04-14',
          messages: localMessageHistory,
          tools: clientToolsSchema.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
            },
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();

      const assistantMessage = responseData.choices[0].message;
      localMessageHistory.push(assistantMessage as Message);

      // If the model wants to make tool calls
      if (assistantMessage.tool_calls) {
        // console.log('🔧 OpenAI requested tool calls');
        const toolCalls = assistantMessage.tool_calls;
        // console.log('🛠️ Tool calls:', JSON.stringify(toolCalls, null, 2));

        // Execute each tool call sequentially and add results to message history
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name as keyof typeof clientTools;
          const tool = clientTools[functionName];
          if (tool) {
            try {
              // console.log(`🔨 Executing tool: ${functionName}`);
              const args = JSON.parse(toolCall.function.arguments);
              // console.log('📝 Tool arguments:', args);
              const result = await tool(args);
              // console.log('✅ Tool result:', result);
              // Add tool result to message history
              localMessageHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              } as Message);
            } catch (error) {
              console.error(`❌ Tool call failed for ${functionName}:`, error);
            }
          } else {
            console.warn(`⚠️ Tool not found: ${functionName}`);
          }
        }
        // Continue the loop - model will see tool results and may make more calls
      } else {
        // Model gave a final response without tool calls
        // console.log('💬 Model provided final response', assistantMessage.content);
        isModelThinking = false;
        return JSON.parse(assistantMessage.content);
      }
    }
  } catch (error) {
    console.error('❌ Error in getNotificationSummary:', error);
    return { title: 'Error', body: 'An error occurred while getting the notification summary.' };
  }
};
