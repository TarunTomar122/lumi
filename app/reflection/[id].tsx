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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReflectionStore } from '../store/reflectionStore';
import { DateTime } from 'luxon';

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

const getResponsiveHeight = (size: number) => {
  const baseHeight = 667; // iPhone 8 height as base
  let scale = height / baseHeight;

  // More aggressive scaling for smaller screens
  if (height < 600) {
    scale = scale * 0.75; // Make 25% smaller for very small screens
  } else if (height < 650) {
    scale = scale * 0.85; // Make 15% smaller for small screens
  }

  return scale * size;
};

const ReflectionDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const reflections = useReflectionStore(state => state.reflections);
  const { updateReflection, deleteReflection } = useReflectionStore();
  const reflection = reflections.find(r => r.id === Number(id));
  const [isLoading, setIsLoading] = React.useState(false);
  const [textContent, setTextContent] = React.useState(reflection?.content || '');
  const [isEditing, setIsEditing] = React.useState(false);
  
  // Parse content to separate prompt and response
  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const promptLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('prompt:'));
    
    if (promptLineIndex === -1) {
      return { prompt: '', response: content };
    }
    
    const prompt = lines[promptLineIndex].substring(7).trim(); // Remove "prompt:" and trim
    const response = lines.slice(promptLineIndex + 1).join('\n').trim();
    
    return { prompt, response };
  };
  
  const { prompt, response } = parseContent(textContent);
  const [responseContent, setResponseContent] = React.useState(response);
  const scrollViewRef = useRef<ScrollView>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const contentInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsEditing(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsEditing(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (reflection?.id) {
      await deleteReflection(reflection.id);
      router.back();
    }
  };

  const debouncedSave = useCallback(
    (newContent: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!reflection?.id) return;
        setIsLoading(true);
        try {
          await updateReflection(reflection.id, { content: newContent });
        } catch (error) {
          console.error('Error auto-saving reflection:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    },
    [reflection?.id, updateReflection]
  );

  const handleTextChange = (text: string) => {
    setResponseContent(text);
    // Reconstruct full content with prompt and response
    const fullContent = prompt ? `prompt: ${prompt}\n\n${text}` : text;
    setTextContent(fullContent);
    debouncedSave(fullContent);
  };

  if (!reflection) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.errorText}>Reflection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {' '}
          {DateTime.fromISO(reflection.date).toFormat('MMMM d')}
        </Text>
        <View style={styles.headerActions}>
          {isLoading && <ActivityIndicator size="small" color="#666666" style={styles.loader} />}
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={getResponsiveSize(28)} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Prompt Section (Non-editable) */}
        {prompt && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptLabel}>Prompt</Text>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
        )}

        {/* Response Input (Editable) */}
        <TextInput
          ref={contentInputRef}
          style={styles.contentInput}
          multiline={true}
          value={responseContent}
          onChangeText={handleTextChange}
          placeholder={prompt ? "Your response..." : "How was your day?"}
          placeholderTextColor="#999999"
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Bottom timestamp */}
      {!isEditing && (
        <View style={styles.bottomInfo}>
          <Text style={styles.timestampText}>
            Edited{' '}
            {new Date(reflection.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: getResponsiveHeight(28),
  },
  container: {
    flex: 1,
    padding: getResponsiveSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveHeight(20),
    paddingBottom: getResponsiveSize(10),
    borderBottomWidth: 1,
    backgroundColor: '#fafafa',
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: getResponsiveSize(24),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveSize(12),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12),
  },
  loader: {
    marginRight: getResponsiveSize(4),
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveSize(12),
  },
  dateTitle: {
    fontSize: getResponsiveSize(22),
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(8),
  },
  contentInput: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    lineHeight: getResponsiveSize(24),
    minHeight: getResponsiveHeight(200),
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  bottomInfo: {
    paddingHorizontal: getResponsiveSize(24),
    paddingVertical: getResponsiveSize(16),
    alignItems: 'center',
  },
  timestampText: {
    fontSize: getResponsiveSize(12),
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  promptContainer: {
    backgroundColor: '#fafafa',
    padding: getResponsiveSize(16),
    marginBottom: getResponsiveSize(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  promptLabel: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'MonaSans-Medium',
    color: '#007AFF',
    marginBottom: getResponsiveSize(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'MonaSans-Regular',
    color: '#333333',
    lineHeight: getResponsiveSize(22),
  },
});

export default ReflectionDetails;
