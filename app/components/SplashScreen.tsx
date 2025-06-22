import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export const SplashScreen = () => {
  const { colors, createThemedStyles } = useTheme();

  const styles = createThemedStyles((colors) => ({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    image: {
      width: 200,
      height: 200,
    },
  }));

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.image} />
    </View>
  );
};
