import { useThemeStore, ThemeColors } from '@/app/store/themeStore';
import { StyleSheet } from 'react-native';

export const useTheme = () => {
  const { colors, isDark, mode, setTheme } = useThemeStore();

  // Helper function to create themed styles
  const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
    styleCreator: (colors: ThemeColors) => T
  ): T => {
    return StyleSheet.create(styleCreator(colors));
  };

  return {
    colors,
    isDark,
    mode,
    setTheme,
    createThemedStyles,
  };
}; 