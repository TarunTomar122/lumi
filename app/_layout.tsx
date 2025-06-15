import { setupNotifications } from '@/utils/tools';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { db } from '../utils/database';
import { Slot } from 'expo-router';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useUserStore } from './store/userStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function NavigatorContent() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <StatusBar style="light" backgroundColor="#FAFAFA" />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const { checkPermissions } = useVoiceRecognition();
  const { initializeUser, isLoading } = useUserStore();
  const [loaded] = useFonts({
    'MonaSans-Regular': require('../assets/fonts/MonaSans-Regular.ttf'),
    'MonaSans-Medium': require('../assets/fonts/MonaSans-Medium.ttf'),
    'MonaSans-SemiBold': require('../assets/fonts/MonaSans-SemiBold.ttf'),
    'MonaSans-Bold': require('../assets/fonts/MonaSans-Bold.ttf'),
  });

  useEffect(() => {
    initializeUser();
    const initializeApp = async () => {
      try {
        // check for audio permissions
        await checkPermissions();
        // setup notifications
        setupNotifications();
        // initialize the database
        await db.init();
        console.log('✅ Database initialized & notifications setup');
      } catch (error) {
        console.error('❌ Error initializing:', error);
      }
    };
    initializeApp();
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return <NavigatorContent />;
}
