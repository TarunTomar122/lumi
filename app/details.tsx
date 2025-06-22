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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemoryStore } from './store/memoryStore';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';
import { useTheme } from '@/hooks/useTheme';

const DetailsPage = () => {
  const router = useRouter();
  const { colors, createThemedStyles } = useTheme();
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

  const styles = createThemedStyles(colors => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
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
      paddingHorizontal: getResponsiveSize(20),
      paddingTop: getResponsiveSize(12),
    },
    scrollContentContainer: {
      paddingBottom: getResponsiveSize(120),
    },
    titleInput: {
      fontSize: getResponsiveSize(22),
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
      paddingVertical: getResponsiveSize(8),
      paddingHorizontal: 0,
    },
    tagsInput: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      paddingHorizontal: 0,
      paddingVertical: getResponsiveSize(8),
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginBottom: getResponsiveSize(18),
    },
    contentInput: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.text,
      lineHeight: getResponsiveSize(24),
      minHeight: getResponsiveHeight(200),
      paddingVertical: 0,
      paddingHorizontal: 0,
      marginBottom: getResponsiveSize(32),
    },
    bottomInfo: {
      paddingHorizontal: getResponsiveSize(24),
      paddingVertical: getResponsiveSize(16),
      alignItems: 'center',
    },
    timestampText: {
      fontSize: getResponsiveSize(12),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.statusBarBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={getResponsiveSize(28)} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {isLoading && <ActivityIndicator size="small" color={colors.textSecondary} style={styles.loader} />}
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={getResponsiveSize(28)} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content with Keyboard Avoiding */}
      <KeyboardAvoidingView
        style={[styles.keyboardAvoidingView, isEditing ? { maxHeight: Dimensions.get('window').height - getResponsiveHeight(120) } : {}]}
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
            placeholderTextColor={colors.textTertiary}
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
            placeholderTextColor={colors.textTertiary}
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
            placeholderTextColor={colors.textTertiary}
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

export default DetailsPage;
