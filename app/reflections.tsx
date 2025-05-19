import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import { useReflectionStore } from './store/reflectionStore';
import InputContainer from './components/inputContainer';

export default function Reflections() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const { reflections, refreshReflections, addReflection } = useReflectionStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshReflections();
    } catch (error) {
      console.error('Error refreshing reflections:', error);
    }
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    refreshReflections();
  }, []);

  const formatDate = (dateStr: string) => {
    return DateTime.fromISO(dateStr).toFormat('MMMM d, yyyy');
  };

  const handleSubmit = async () => {
    if (!userResponse) return;

    let date = DateTime.now();
    let content = userResponse;

    // First split by colon
    const parts = userResponse.split(':');
    
    if (parts.length > 1) {
      // Everything before the first colon is potential date
      const datePart = parts[0].trim();
      // Everything after the first colon is content
      content = parts.slice(1).join(':').trim();
      
      // Now try to parse the date part - it can be either "2 apr" or "apr 2"
      const dateWords = datePart.split(/\s+/);
      
      // Get the last two words (in case there's text before the date)
      const lastTwo = dateWords.slice(-2);
      
      console.log('lastTwo', lastTwo);
      console.log('dateWords', dateWords);

      if (lastTwo.length === 2) {
        // Try all possible formats
        const formats = ['d MMMM', 'MMMM d', 'd MMM', 'MMM d'];
        let parsedDate = null;

        for (const format of formats) {
          const attempt = DateTime.fromFormat(lastTwo.join(' '), format);
          if (attempt.isValid) {
            parsedDate = attempt;
            break;
          }
        }

        console.log('parsedDate', parsedDate?.toISODate());

        if (parsedDate?.isValid) {
          date = parsedDate.set({ year: DateTime.now().year });
        }

        console.log('final date', date.toISODate());
      }
    }

    console.log('date', date.toISODate(), 'content', content);

    await addReflection(date.toISODate() || '', content);
    setUserResponse('');
    refreshReflections();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>Reflections</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ScrollView
          style={styles.reflectionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
          {reflections.map(reflection => (
            <TouchableOpacity
              key={reflection.id}
              style={styles.reflectionItem}
              onPress={() => router.push(`/reflection/${reflection.id}`)}>
              <Text style={styles.reflectionDate}>{formatDate(reflection.date)}</Text>
              <Text style={styles.reflectionPreview} numberOfLines={2}>
                {reflection.content}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          placeholder="reflection"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  backText: {
    fontSize: 24,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 3,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  reflectionsList: {
    flex: 1,
  },
  reflectionItem: {
    marginBottom: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  reflectionDate: {
    fontSize: 18,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 8,
  },
  reflectionPreview: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    lineHeight: 22,
  },
});
