import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, usePathname } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  index: undefined;
  tasks: undefined;
};

const { width } = Dimensions.get('window');

export function CustomBottomNav() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.navButton, pathname === '/tasks' && styles.selectedNavButton]}
          onPress={() => navigation.navigate('tasks')}>
          <Ionicons name="list-outline" size={28} color={pathname === '/tasks' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, pathname === '/' && styles.selectedNavButton]}
          onPress={() => navigation.navigate('index')}>
          <Ionicons name="home-outline" size={30} color={pathname === '/' ? '#FFF' : '#000'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 120,
    right: 120,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingBottom: 30,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: 60,
    height: 60,
    borderRadius: 40,
  },
  selectedNavButton: {
    backgroundColor: '#000000',
  },
});
