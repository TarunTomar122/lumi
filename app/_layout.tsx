import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, } from 'react-native';
import { initializeFirebase } from '../config/firebase';
import { db } from '../utils/database';
import { CustomBottomNav } from './components/CustomBottomNav';
import { Slot } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function NavigatorContent() {
  return (
    <View style={{ flex: 1, backgroundColor: '#DAD9DE'}}>
      {/* <Header /> */}
      <StatusBar style="light-content" backgroundColor="#DAD9DE" />
      <Slot />
      <CustomBottomNav />
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    'MonaSans-Regular': require('../assets/fonts/MonaSans-Regular.ttf'),
    'MonaSans-Medium': require('../assets/fonts/MonaSans-Medium.ttf'),
    'MonaSans-SemiBold': require('../assets/fonts/MonaSans-SemiBold.ttf'),
    'MonaSans-Bold': require('../assets/fonts/MonaSans-Bold.ttf'),
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firebase
        // initializeFirebase();
        // Initialize SQLite database
        await db.init();
        console.log('✅ Database initialized');
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

  return (
    <NavigatorContent />
  );
}
