import { useNavigation } from 'expo-router';
import { Pressable, Text, View, StyleSheet, Button } from 'react-native';
import React from 'react';

import { useAuth } from '@/hooks/useAuth';

const Profile = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.userInfoContainer}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.email}>Hello, {user?.displayName}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={() => signOut()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default Profile;
