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
  const [keyboardHeight, setKeyboardHeight] = React.useState(Dimensions.get('window').height);
  const [isEditing, setIsEditing] = React.useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardHeight(400);
      setIsEditing(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(Dimensions.get('window').height);
      setIsEditing(false);
    });

    return () => {
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
      }, 300);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#000000" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text>Reflection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>
            {DateTime.fromISO(reflection.date).toFormat('d MMM yyyy')}
          </Text>
        </TouchableOpacity>
        {isLoading && <ActivityIndicator size="small" color="#000000" style={styles.loader} />}
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={28} color="#000000" />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[{ maxHeight: keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        style={styles.contentContainer}>
        <TextInput
          style={styles.text}
          multiline={true}
          value={textContent}
          onChangeText={handleTextChange}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 42,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  text: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    top: 720,
    left: 280,
    right: -280,
    paddingHorizontal: 24,
  },
});

export default ReflectionDetails; 