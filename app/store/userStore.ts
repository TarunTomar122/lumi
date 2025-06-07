import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  username: string;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  setUsername: (username: string) => void;
  setOnboardingComplete: (username: string) => Promise<void>;
  initializeUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  username: '',
  hasCompletedOnboarding: false,
  isLoading: true,

  setUsername: (username: string) => {
    set({ username });
  },

  setOnboardingComplete: async (username: string) => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await AsyncStorage.setItem('username', username);
      set({ 
        username, 
        hasCompletedOnboarding: true 
      });
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  },

  initializeUser: async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      const storedUsername = await AsyncStorage.getItem('username');
      
      set({
        hasCompletedOnboarding: hasCompletedOnboarding === 'true',
        username: storedUsername || '',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error initializing user:', error);
      set({ isLoading: false });
    }
  },
})); 