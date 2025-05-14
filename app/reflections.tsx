import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InputContainer from './components/inputContainer';
import { useReflectionStore } from './store/reflectionStore';

export default function Reflections() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { reflections, addReflection, refreshReflections } = useReflectionStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshReflections();
    } catch (error) {
      console.error('Error refreshing reflections:', error);
    }
    setRefreshing(false);
  }, []);

  const handleSubmit = () => {
    if (!userResponse) return;

    addReflection({
      date: new Date()
        .toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
        })
        .toLowerCase(),
      text: userResponse,
    });

    setUserResponse('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>reflections</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#000000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.wip}>WIP</Text>
        <ScrollView
          style={styles.reflectionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
          {reflections.map(reflection => (
            <View key={reflection.id} style={styles.reflectionItem}>
              <Text style={styles.date}>{reflection.date}</Text>
              <Text style={styles.text}>{reflection.text}</Text>
            </View>
          ))}
        </ScrollView>

        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  wip: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: 'red',
    marginBottom: 20,
  },
  reflectionsList: {
    flex: 1,
  },
  reflectionItem: {
    marginBottom: 24,
  },
  date: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
});
