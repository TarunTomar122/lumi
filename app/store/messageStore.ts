import { create } from 'zustand';
import { SYSTEM_MESSAGE } from '@/utils/system-message';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
}

interface MessageState {
  messageHistory: Message[];
  addMessage: (message: Message) => void;
  updateMessageHistory: (messages: Message[]) => void;
  clearMessageHistory: () => void;
}

const initialMessage: Message = {
  role: 'assistant',
  content: 'Hello tarat, \nWhat is on your mind right now?'
};

export const useMessageStore = create<MessageState>((set) => ({
  messageHistory: [SYSTEM_MESSAGE as Message, initialMessage],
  addMessage: (message) => set((state) => ({ 
    messageHistory: [...state.messageHistory, message] 
  })),
  updateMessageHistory: (messages) => set({ messageHistory: messages }),
  clearMessageHistory: () => set({ 
    messageHistory: [SYSTEM_MESSAGE as Message, initialMessage] 
  }),
})); 