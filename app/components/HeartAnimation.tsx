import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const HeartAnimation = () => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    // Scale animation
    scale.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Rotation animation
    rotate.value = withRepeat(
      withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Opacity animation
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <AnimatedSvg
        width={200}
        height={150}
        viewBox="0 0 94 69"
        fill="none"
        style={animatedStyle}
      >
        <Path
          d="M63.192 63.192C62.2729 60.3126 54.2823 36.5318 57.3457 36.0911C60.8606 35.5854 65.2666 44.5786 66.4983 46.9651C68.6579 51.1499 68.8533 57.5005 68.8796 50.3194C68.9079 42.5586 73.8226 37.7771 79.9917 34.0073C83.3201 31.9734 85.9017 31.278 85.7162 36.1627C85.3558 45.6521 72.4787 60.2122 66.4983 66.6886"
          stroke="#FF6B6B"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d="M30.7078 54.9262C25.2923 50.9411 -9.04037 11.6457 5.608 5.51847C13.684 2.14042 23.2975 19.8885 26.2921 24.6813C29.7968 30.2906 30.7325 43.1944 29.081 30.6841C27.8979 21.7226 27.1533 8.03437 36.8665 3.2097C44.3183 -0.491688 47.3308 4.85477 47.441 11.7522C47.6869 27.1433 45.1202 40.6053 38.1448 54.4645C36.9385 56.8612 32.4617 61.3277 36.9827 59.082"
          stroke="#FF6B6B"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </AnimatedSvg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});

export default HeartAnimation; 