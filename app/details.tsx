import React, { useRef } from 'react';
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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatDate } from '@/utils/commons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemoryStore } from './store/memoryStore';

import { Dimensions, NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native';

const DetailsPage = () => {
  const router = useRouter();
  const { item: itemString } = useLocalSearchParams();
  const item = JSON.parse(itemString as string);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { updateMemory } = useMemoryStore();
  const [title, setTitle] = React.useState<string>(item.title);
  const [textContent, setTextContent] = React.useState<string>(item.text);
  const [hasEdited, setHasEdited] = React.useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(Dimensions.get('window').height);
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardHeight(400);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(Dimensions.get('window').height);
    });
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateMemory(item.id, {
        text: textContent,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <TextInput
              style={styles.title}
              value={title}
              multiline={true}
              onChangeText={text => {
                setTitle(text);
                setHasEdited(true);
              }}
            />
            <Text style={styles.date}>
              last updated: {formatDate(item.due_date || item.reminder_date || item.date)}
            </Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag: string) => (
                <Text style={styles.tag} key={tag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000000" />
          ) : (
            <>
              {hasEdited ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleSave()}>
                  <Ionicons name="checkmark" size={32} color="#000000" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={() => router.back()}>
                  <Ionicons name="close" size={32} color="#000000" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[{ maxHeight: keyboardHeight }]}
          showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.text}
            multiline={true}
            value={textContent}
            onChangeText={text => {
              setTextContent(text);
              setHasEdited(true);
            }}
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 32,
    minHeight: Dimensions.get('window').height,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  titleContainer: {
    marginVertical: 20,
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
  tag: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
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
