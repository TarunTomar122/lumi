import React, { useRef, useCallback } from 'react';
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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatDate } from '@/utils/commons';
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
  const [hasEdited, setHasEdited] = React.useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(Dimensions.get('window').height);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardHeight(400);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(Dimensions.get('window').height);
    });

    // Clean up timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMemory(item.id, {
        content: textContent,
        title: title,
        tags: item.tags || [],
      });
      setHasEdited(false);
    } catch (error) {
      console.error('Error updating memory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    await deleteMemory(item.id);
    router.back();
  };

  // Debounced auto-save function
  const debouncedSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          await updateMemory(item.id, {
            content: newContent,
            title: newTitle,
            tags: item.tags || [],
          });
          setHasEdited(false);
        } catch (error) {
          console.error('Error auto-saving memory:', error);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [item.id, item.tags, updateMemory]
  );

  const handleTextChange = (text: string) => {
    setTextContent(text);
    setHasEdited(true);
    debouncedSave(title, text);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasEdited(true);
    debouncedSave(text, textContent);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>Notes</Text>
        </TouchableOpacity>
        {isLoading && <ActivityIndicator size="small" color="#000000" style={styles.loader} />}
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <TextInput
              style={styles.title}
              value={title}
              multiline={true}
              onChangeText={handleTitleChange}
            />
            <Text style={styles.date}>
              last updated: {formatDate(item.due_date || item.reminder_date || item.date)}
            </Text>
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[{ maxHeight: keyboardHeight }]}
          showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.text}
            multiline={true}
            value={textContent}
            onChangeText={handleTextChange}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  loader: {
    marginRight: 12,
  },
  contentContainer: {
    padding: 24,
    minHeight: Dimensions.get('window').height,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  titleContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#4B4B4B',
    paddingBottom: 20,
  },
  titleWrapper: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#A1887F',
    fontFamily: 'MonaSans-Regular',
    marginTop: 8,
  },
  text: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
    lineHeight: 28,
    paddingBottom: 30,
  },
});

export default DetailsPage;
