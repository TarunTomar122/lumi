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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReflectionStore } from '../store/reflectionStore';
import { Dimensions } from 'react-native';
import { DateTime } from 'luxon';

const ReflectionDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const reflections = useReflectionStore(state => state.reflections);
  const { updateReflection, deleteReflection } = useReflectionStore();
  const reflection = reflections.find(r => r.id === Number(id));
  const [isLoading, setIsLoading] = React.useState(false);
  const [textContent, setTextContent] = React.useState(reflection?.content || '');
  const [isEditing, setIsEditing] = React.useState(false);
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
    setTextContent(text);
    debouncedSave(text);
  };

  if (!reflection) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={28} color="#000000" />
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
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Reflection</Text>
        <View style={styles.headerActions}>
          {isLoading && <ActivityIndicator size="small" color="#666666" style={styles.loader} />}
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Date Title */}
        <Text style={styles.dateTitle}>
          {DateTime.fromISO(reflection.date).toFormat('EEEE, MMMM d, yyyy')}
        </Text>

        {/* Content Input */}
        <TextInput
          ref={contentInputRef}
          style={styles.contentInput}
          multiline={true}
          value={textContent}
          onChangeText={handleTextChange}
          placeholder="How was your day?"
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
    paddingTop: 42,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
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
  headerTitle: {
    fontSize: 22,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
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
  dateTitle: {
    fontSize: 22,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    lineHeight: 24,
    minHeight: 200,
    paddingVertical: 0,
    paddingHorizontal: 0,
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
});

export default ReflectionDetails;
