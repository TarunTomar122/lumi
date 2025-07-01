import { checkNotificationPermission } from '@/utils/tools';
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
import notifee from '@notifee/react-native';

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

// Setup notification channels only if permission already exists
const setupNotificationChannelsIfPermitted = async () => {
  try {
    const hasPermission = await checkNotificationPermission();
    if (hasPermission) {
      await notifee.createChannel({
        id: 'reminder',
        name: 'Reminder Channel',
      });
      
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });
      
      console.log('✅ Notification channels setup (permission already granted)');
    } else {
      console.log('⏳ Notification permission not granted - channels will be setup when needed');
    }
  } catch (error) {
    console.error('Error setting up notification channels:', error);
  }
};

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
        // setup notifications channels only if permission exists
        await setupNotificationChannelsIfPermitted();
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
