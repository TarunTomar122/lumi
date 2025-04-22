import { useNavigation } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import React, { useEffect, useState } from "react";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import { supabase } from '@/utils/supabase';
import { clientTools } from '@/utils/tools';
import { clientToolsSchema } from '@/utils/tools';

export default function Home() {
  const navigation = useNavigation();
  const { state, startRecognizing, stopRecognizing, destroyRecognizer } = useVoiceRecognition();
  const [assistantResponse, setAssistantResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Watch for transcription results when we're waiting for them
  useEffect(() => {
    if (pendingSubmit && state.results[0]) {
      setPendingSubmit(false);
      handleSubmit();
    }
  }, [state.results, pendingSubmit]);

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
      console.log("No results to send");
      return;
    }
    const message = state.results[0];
    // const message = "what is my battery level?";
    try {
      setIsLoading(true);
      console.log("🎤 Transcribed message:", message);
      
      // Get API key
      // console.log("📡 Getting API key from Supabase...");
      // const { data: tokenData, error } = await supabase.functions.invoke('token');
      // if (error) {
      //   console.error("❌ Failed to get API key:", error);
      //   throw error;
      // }
      // console.log("✅ Got API key", tokenData);
      // const EPHEMERAL_KEY = tokenData.client_secret.value;
      // console.log("EPHEMERAL_KEY:", EPHEMERAL_KEY);
      // Send message to OpenAI
      // console.log("📤 Sending message to OpenAI...");
      const requestBody = {
        model: 'gpt-4.1-nano-2025-04-14',
        messages: [{
          role: 'user',
          content: message
        }],
        tools: clientToolsSchema.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            // @ts-ignore - we know these tools have parameters
            parameters: tool.parameters
          }
        }))
      };
      console.log("📦 Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ OpenAI API error:", errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log("📥 OpenAI response:", JSON.stringify(responseData, null, 2));
      
      // Handle tool calls if any
      if (responseData.choices[0]?.message?.tool_calls) {
        console.log("🔧 OpenAI requested tool calls");
        const toolCalls = responseData.choices[0].message.tool_calls;
        console.log("🛠️ Tool calls:", JSON.stringify(toolCalls, null, 2));

        const results = await Promise.all(toolCalls.map(async (toolCall: any) => {
          const tool = clientTools[toolCall.function.name as keyof typeof clientTools];
          if (tool) {
            try {
              console.log(`🔨 Executing tool: ${toolCall.function.name}`);
              const args = JSON.parse(toolCall.function.arguments);
              console.log("📝 Tool arguments:", args);
              const result = await tool(args);
              console.log("✅ Tool result:", result);
              return {
                tool_call_id: toolCall.id,
                result: result
              };
            } catch (error) {
              console.error(`❌ Tool call failed for ${toolCall.function.name}:`, error);
              return null;
            }
          }
          console.warn(`⚠️ Tool not found: ${toolCall.function.name}`);
          return null;
        }));

        // Send results back to get final response
        console.log("📤 Sending tool results back to OpenAI...");
        
        // Create messages array with user message and assistant's tool calls
        const messages = [
          { role: 'user', content: message },
          responseData.choices[0].message,
        ];

        // Add tool results as separate messages
        results.forEach(result => {
          if (result) {
            messages.push({
              role: 'tool',
              tool_call_id: result.tool_call_id,
              content: JSON.stringify(result.result)
            });
          }
        });

        const finalRequestBody = {
          model: 'gpt-4.1-nano-2025-04-14',
          messages: messages
        };
        console.log("📦 Final request body:", JSON.stringify(finalRequestBody, null, 2));

        const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalRequestBody)
        });

        if (!finalResponse.ok) {
          const errorData = await finalResponse.json();
          console.error("❌ Final OpenAI API error:", errorData);
          throw new Error('Failed to get final response');
        }

        const finalData = await finalResponse.json();
        console.log("📥 Final OpenAI response:", JSON.stringify(finalData, null, 2));
        setAssistantResponse(finalData.choices[0]?.message?.content || 'No response');
      } else {
        console.log("💬 Direct response without tool calls");
        setAssistantResponse(responseData.choices[0]?.message?.content || 'No response');
      }
      console.log("✨ All done!");
    } catch (e) {
      console.error("❌ Error in handleSubmit:", e);
      setAssistantResponse("Sorry, there was an error processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.messageText}>
          {state.results[0] || "What can I help you with?"}
        </Text>
        
        {assistantResponse && (
          <Text style={styles.responseText}>
            {assistantResponse}
          </Text>
        )}

        <Pressable
          onPress={handleToggleRecording}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
            isRecording && styles.buttonRecording
          ]}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Processing..." : isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 30,
  },
  messageText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 20,
  },
  responseText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonPressed: {
    backgroundColor: '#333333',
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonRecording: {
    backgroundColor: '#FF4444',
  },
});
