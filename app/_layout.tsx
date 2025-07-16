import { checkNotificationPermission } from '@/utils/tools';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { db } from '../utils/database';
import { Slot } from 'expo-router';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useUserStore } from './store/userStore';
import { useThemeStore } from './store/themeStore';
import notifee from '@notifee/react-native';
import { UpdateModal } from './components/ReleaseNotesModal';
import { checkForAppUpdate, UpdateInfo } from '../utils/versionChecker';
import { ReflectionReminderService } from '../utils/reflectionReminder';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function NavigatorContent() {
  const { colors } = useThemeStore();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Check for app updates
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const updateResult = await checkForAppUpdate();
        console.log('updateResult', updateResult);
        if (updateResult && updateResult.updateAvailable) {
          // Small delay to ensure app is fully loaded
          setTimeout(() => {
            setUpdateInfo(updateResult);
            setShowUpdateModal(true);
          }, 2000); // 2 seconds delay for better UX
        }
      } catch (error) {
        console.error('Error checking for app updates:', error);
      }
    };

    // Check for updates after a short delay
    const timeout = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBarStyle as any} backgroundColor={colors.statusBarBackground} />
      <Slot />
      <UpdateModal 
        visible={showUpdateModal} 
        updateInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
        onDismiss={() => setShowUpdateModal(false)}
      />
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
        // initialize reflection reminder service (runs in background)
        ReflectionReminderService.init();
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
