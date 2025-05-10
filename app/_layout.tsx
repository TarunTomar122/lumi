import { setupNotifications } from '@/utils/tools';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { db } from '../utils/database';
import { Slot } from 'expo-router';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function NavigatorContent() {
  return (
    <View style={{ flex: 1, backgroundColor: '#2B2B2B' }}>
      <StatusBar style="light-content" backgroundColor="#2B2B2B" />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const { checkPermissions } = useVoiceRecognition();
  const [loaded] = useFonts({
    'MonaSans-Regular': require('../assets/fonts/MonaSans-Regular.ttf'),
    'MonaSans-Medium': require('../assets/fonts/MonaSans-Medium.ttf'),
    'MonaSans-SemiBold': require('../assets/fonts/MonaSans-SemiBold.ttf'),
    'MonaSans-Bold': require('../assets/fonts/MonaSans-Bold.ttf'),
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // warm up the server
        fetch('https://lumi-server-iixq.onrender.com/api/test');
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

    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <NavigatorContent />;
}
