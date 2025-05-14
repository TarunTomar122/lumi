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
import { useHabitStore } from './store/habitStore';

export default function Habits() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { habits, updateHabitProgress, refreshHabits } = useHabitStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHabits();
    } catch (error) {
      console.error('Error refreshing habits:', error);
    }
    setRefreshing(false);
  }, []);

  const handleSubmit = () => {
    // TODO: Implement habit submission
    console.log('Submitting habit:', userResponse);
  };

  const ProgressCircles = ({
    progress,
    total = 6,
    color,
  }: {
    progress: number;
    total?: number;
    color: string;
  }) => {
    return (
      <View style={styles.progressContainer}>
        {[...Array(total)].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.circle, index < progress && { backgroundColor: color }]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>habits</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#000000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.wip}>WIP</Text>
        <ScrollView
          style={styles.habitsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
          {habits.map(habit => (
            <View key={habit.id} style={styles.habitItem}>
              <Text style={styles.habitTitle}>{habit.title}</Text>
              <ProgressCircles progress={habit.progress} color={habit.color} />
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
  habitsList: {
    flex: 1,
  },
  habitItem: {
    marginBottom: 24,
  },
  habitTitle: {
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  wip: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: 'red',
    marginBottom: 20,
  },
});
