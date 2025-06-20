import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Responsive helper functions
const getResponsiveSize = (size: number) => {
  const baseWidth = 375; // iPhone 8 width as base
  let scale = width / baseWidth;

  // More aggressive scaling for smaller screens
  if (width < 350) {
    scale = scale * 0.8; // Make 20% smaller for very small screens
  } else if (width < 370) {
    scale = scale * 0.9; // Make 10% smaller for small screens
  }

  return scale * size;
};

type HomeCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
};

const getSubtitle = (title: string) => {
  if (title === 'Tasks') return 'For your todos and reminders';
  if (title === 'Notes') return 'For your notes and ideas';
  if (title === 'Habits') return 'For your habits and routines';
  if (title === 'Reflections') return 'For your daily reflections';
};

export default function HomeCard({ title, icon, onPress, disabled }: HomeCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}>
      <Ionicons name={icon} size={getResponsiveSize(24)} color="#000000" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{getSubtitle(title)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: getResponsiveSize(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: getResponsiveSize(8),
    borderRadius: getResponsiveSize(6),
  },
  title: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    lineHeight: getResponsiveSize(20),
  },
  disabled: {
    opacity: 0.5,
  },
});
