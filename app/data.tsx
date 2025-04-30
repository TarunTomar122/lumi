import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Page = () => {
  return (
    <View>
      <TouchableOpacity>
        <Ionicons name="save-outline" size={32} style={styles.headerIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerIcon: {
    color: '#795548',
  },
});
