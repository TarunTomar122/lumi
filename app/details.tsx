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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemoryStore } from './store/memoryStore';
import { Dimensions } from 'react-native';
import InputContainer from './components/inputContainer';

const DetailsPage = () => {
  const router = useRouter();
  const { item: itemString } = useLocalSearchParams();
  const item = JSON.parse(itemString as string);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { updateMemory, deleteMemory } = useMemoryStore();
  const [title, setTitle] = React.useState<string>(item.title);
  const [textContent, setTextContent] = React.useState<string>(item.content);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(Dimensions.get('window').height);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const [userResponse, setUserResponse] = React.useState<string>('');
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [isThinking, setIsThinking] = React.useState<boolean>(false);

  React.useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardHeight(400);
      setIsEditing(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(Dimensions.get('window').height);
      setIsEditing(false);
    });

    // Clean up timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    await deleteMemory(item.id);
    router.back();
  };

  React.useEffect(() => {
    console.log('userResponse', userResponse);
  }, [userResponse]);

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
    debouncedSave(title, text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
          <Text style={styles.backText}>
            {item.title.slice(0, 22) + (item.title.length > 22 ? '...' : '')}
          </Text>
        </TouchableOpacity>
        {isLoading && <ActivityIndicator size="small" color="#000000" style={styles.loader} />}

        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={28} color="#000000" />
        </TouchableOpacity>

        {/* {isEditing && (
          <InputContainer
            userResponse={userResponse}
            setUserResponse={setUserResponse}
            setStreamedResponse={(response: string) => {
              console.log('response', response);
            }}
            handleSubmit={() => {}}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onlyRecording={true}
          />
        )} */}
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
      {/* <View style={styles.inputContainer}>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onlyRecording={true}
        />
      </View> */}
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

export default DetailsPage;
