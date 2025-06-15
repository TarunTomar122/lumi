import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});
