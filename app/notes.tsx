import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemoryStore } from './store/memoryStore';
import InputContainer from './components/inputContainer';
import { useMessageStore } from './store/messageStore';
import { clientTools } from '@/utils/tools';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';

export default function Notes() {
  const router = useRouter();
  const [userResponse, setUserResponse] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { memories, refreshMemories } = useMemoryStore();
  const { tag } = useLocalSearchParams();
  const [filteredMemories, setFilteredMemories] = React.useState(memories);
  const [uniqueTags, setUniqueTags] = React.useState<string[]>([]);
  const { messageHistory, updateMessageHistory, clearMessageHistory } = useMessageStore();
  const [assistantResponse, setAssistantResponse] = React.useState('');
  const [isThinking, setIsThinking] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState<string>('home');

  React.useEffect(() => {
    const tags = memories.map(memory => memory.tags).flat();
    const uniqueTags = [...new Set(tags)];
    setUniqueTags(uniqueTags);
    if (tag) {
      setFilteredMemories(memories.filter(memory => memory.tags.includes(tag as string)));
    } else {
      setFilteredMemories(memories);
    }
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

  const navigateTo = (path: 'tasks' | 'notes' | 'habits' | 'reflections' | '') => {
    router.push(`/${path}`);
  };

  const handleSubmit = () => {
    // Extract tag and content from format "tag: content" if present
    const tagRegex = /^([a-zA-Z]+):\s*(.+)$/;
    const match = userResponse.match(tagRegex);

    let selectedTag = (tag as string) || 'untagged';
    let noteContent = userResponse;

    if (match) {
      // If we found a tag in the format "tag: content"
      const [_, extractedTag, content] = match;
      selectedTag = extractedTag.toLowerCase();
      noteContent = content.trim();
    }

    // Create title from first 3 words of content
    const words = noteContent.split(/\s+/);
    const title = words.slice(0, 3).join(' ');

    clientTools.addMemory({
      title,
      content: noteContent,
      tags: [selectedTag],
    });
    refreshMemories();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#000000" />
          <Text style={styles.backText}>Notes</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {filteredMemories.length === 0 && (
          <View style={styles.noNotesContainer}>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Start capturing your thoughts!</Text>

              <View style={styles.examplesContainer}>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleText}>"work: meeting with client tomorrow"</Text>
                  <Text style={styles.exampleDescription}>Work-related notes</Text>
                </View>
                <View style={styles.exampleItem}>
                  <Text style={styles.exampleText}>"ideas: app feature for location sharing"</Text>
                  <Text style={styles.exampleDescription}>Creative thoughts</Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onlyRecording={false}
          placeholder="Work: This is a work note"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: getResponsiveHeight(28),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveHeight(20),
    paddingBottom: getResponsiveSize(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveSize(12),
  },
  backText: {
    fontSize: getResponsiveSize(24),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(3),
  },
  container: {
    flex: 1,
    padding: getResponsiveSize(24),
  },
  title: {
    fontSize: getResponsiveSize(32),
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  tagsList: {
    paddingRight: getResponsiveSize(12),
    maxHeight: getResponsiveSize(40),
  },
  tagContainer: {
    marginTop: getResponsiveSize(2),
    marginRight: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(8),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#f0f0f0',
  },
  activeTagContainer: {
    backgroundColor: '#FFF0F3',
  },
  noNotesContainer: {
    flex: 1,
    gap: getResponsiveSize(12),
  },
  noNotesText: {
    fontSize: getResponsiveSize(18),
  },
  suggestionText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Roboto-Regular',
    color: '#000000',
  },
  tag: {
    fontSize: getResponsiveSize(16),
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    paddingVertical: getResponsiveSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: getResponsiveSize(12),
  },
  noteTitle: {
    fontSize: getResponsiveSize(20),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: getResponsiveSize(4),
  },
  noteText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    padding: getResponsiveSize(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: getResponsiveSize(12),
  },
  emptyStateTitle: {
    fontSize: getResponsiveSize(20),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(24),
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: getResponsiveSize(12),
  },
  emptyStateSubtitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: getResponsiveSize(20),
    textAlign: 'center',
    lineHeight: getResponsiveSize(22),
  },
  examplesContainer: {
    gap: getResponsiveSize(16),
    marginBottom: getResponsiveSize(20),
  },
  exampleItem: {
    gap: getResponsiveSize(4),
  },
  exampleText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    fontStyle: 'italic',
  },
  exampleDescription: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Roboto-Regular',
    color: '#999999',
  },
  emptyStateFooter: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  proTipsContainer: {
    marginTop: getResponsiveSize(20),
    paddingTop: getResponsiveSize(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  proTipsTitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(12),
  },
  tipItem: {
    marginBottom: getResponsiveSize(8),
  },
  tipText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: getResponsiveSize(20),
  },
});
