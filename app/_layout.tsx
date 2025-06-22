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
import { useThemeStore } from './store/themeStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function NavigatorContent() {
  const { colors } = useThemeStore();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle} backgroundColor={colors.statusBarBackground} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const { checkPermissions } = useVoiceRecognition();
  const { initializeUser, isLoading } = useUserStore();
  const { initializeTheme } = useThemeStore();
  const [loaded] = useFonts({
    'MonaSans-Regular': require('../assets/fonts/MonaSans-Regular.ttf'),
    'MonaSans-Medium': require('../assets/fonts/MonaSans-Medium.ttf'),
    'MonaSans-SemiBold': require('../assets/fonts/MonaSans-SemiBold.ttf'),
    'MonaSans-Bold': require('../assets/fonts/MonaSans-Bold.ttf'),
  });

  useEffect(() => {
    initializeUser();
    
    // Initialize theme system
    const themeSubscription = initializeTheme();
    
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

    // Cleanup theme subscription
    return () => {
      themeSubscription?.remove();
    };
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return <NavigatorContent />;
}
