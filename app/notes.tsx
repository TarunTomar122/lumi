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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemoryStore } from './store/memoryStore';

export default function Notes() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { memories, refreshMemories } = useMemoryStore();
  const { tag } = useLocalSearchParams();
  const [filteredMemories, setFilteredMemories] = React.useState(memories);
  const [uniqueTags, setUniqueTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    const tags = memories.map(memory => memory.tags).flat();
    const uniqueTags = [...new Set(tags)];
    setUniqueTags(uniqueTags);
  }, [memories]);

  React.useEffect(() => {
    refreshMemories();
    if (tag) {
      setFilteredMemories(memories.filter(memory => memory.tags.includes(tag as string)));
    } else {
      setFilteredMemories(memories);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMemories();
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
    setRefreshing(false);
  }, []);

  const handleSubmit = () => {
    // TODO: Implement note submission
    console.log('Submitting note:', userResponse);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>Notes</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ScrollView horizontal style={styles.tagsList} showsHorizontalScrollIndicator={false}>
          {uniqueTags.map((currTag, index) => (
            <TouchableOpacity
              style={[styles.tagContainer, tag === currTag && styles.activeTagContainer]}
              key={index}
              onPress={() => {
                if (tag === currTag) {
                  router.push({
                    pathname: '/notes',
                  });
                } else {
                  router.push({
                    pathname: '/notes',
                    params: { tag: currTag },
                  });
                }
              }}>
              <Text style={styles.tag}>{currTag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView
          style={styles.notesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" />
          }>
          {filteredMemories.map((note, index) => (
            <TouchableOpacity
              key={index}
              style={styles.noteItem}
              onPress={() => {
                router.push({
                  pathname: '/details',
                  params: { item: JSON.stringify(note) },
                });
              }}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteText} numberOfLines={1}>
                {note.content}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  tagsList: {
    marginBottom: 12,
    paddingRight: 12,
    maxHeight: 40,
  },
  tagContainer: {
    marginTop: 2,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeTagContainer: {
    backgroundColor: '#FFFCE3',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tag: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
});
