import { SYSTEM_MESSAGE } from './system-message';
import { clientTools, clientToolsSchema } from './tools';

interface Message {
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
  setIsLoading: (loading: boolean) => void
) => {
  const userMessage: Message = { role: 'user', content: userResponse };
  const currentMessageHistory = [...messageHistory, userMessage];
  updateHistory(currentMessageHistory);
  try {
    setIsThinking(true);
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
              } as Message);
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
