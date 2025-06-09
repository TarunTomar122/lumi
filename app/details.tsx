import * as React from 'react';
import { useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemoryStore } from './store/memoryStore';
import { Dimensions } from 'react-native';

const DetailsPage = () => {
  const router = useRouter();
  const { item: itemString } = useLocalSearchParams();
  const item = JSON.parse(itemString as string);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { updateMemory, deleteMemory } = useMemoryStore();
  const [title, setTitle] = React.useState<string>(item.title);
  const [textContent, setTextContent] = React.useState<string>(item.content);
  const [tags, setTags] = React.useState<string>(item.tags?.join(', ') || '');
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const titleInputRef = React.useRef<TextInput>(null);
  const tagsInputRef = React.useRef<TextInput>(null);
  const contentInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsEditing(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsEditing(false);
    });

    // Clean up timeout on unmount
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    await deleteMemory(item.id);
    router.back();
  };

  // Debounced auto-save function
  const debouncedSave = useCallback(
    (newTitle: string, newContent: string, newTags: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Convert tags string to array
          const tagsArray = newTags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

          await updateMemory(item.id, {
            content: newContent,
            title: newTitle,
            tags: tagsArray,
          });
        } catch (error) {
          console.error('Error auto-saving memory:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    },
    [item.id, updateMemory]
  );

  const handleTitleChange = (text: string) => {
    setTitle(text);
    debouncedSave(text, textContent, tags);
  };

  const handleTagsChange = (text: string) => {
    setTags(text);
    debouncedSave(title, textContent, text);
  };

  const handleTextChange = (text: string) => {
    setTextContent(text);
    debouncedSave(title, text, tags);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {isLoading && <ActivityIndicator size="small" color="#666666" style={styles.loader} />}
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content with Keyboard Avoiding */}
      <KeyboardAvoidingView
        style={[styles.keyboardAvoidingView, isEditing ? { maxHeight: Dimensions.get('window').height - 120 } : {}]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {/* Title Input */}
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor="#999999"
            multiline={true}
            returnKeyType="next"
            onSubmitEditing={() => tagsInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Tags Input */}
          <TextInput
            ref={tagsInputRef}
            style={styles.tagsInput}
            value={tags}
            onChangeText={handleTagsChange}
            placeholder="Tags (comma separated)"
            placeholderTextColor="#999999"
            multiline={false}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            multiline={true}
            value={textContent}
            onChangeText={handleTextChange}
            placeholder="Note"
            placeholderTextColor="#999999"
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom timestamp */}
      <View style={styles.bottomInfo}>
        <Text style={styles.timestampText}>
          Edited {item.created_at ? 
            new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }) : 
            'just now'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

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
    backgroundColor: '#fafafa',
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loader: {
    marginRight: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  scrollContentContainer: {
    paddingBottom: 120,
  },
  titleInput: {
    fontSize: 22,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  tagsInput: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 18,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    lineHeight: 24,
    minHeight: 200,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  bottomInfo: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default DetailsPage;
