import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatDate } from '@/utils/commons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMessageStore } from './store/messageStore';
import { useMemoryStore } from './store/memoryStore';

const DetailsPage = () => {
  const router = useRouter();
  const { item: itemString } = useLocalSearchParams();
  const item = JSON.parse(itemString as string);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { clearMessageHistory } = useMessageStore();
  const { updateMemory, deleteMemory } = useMemoryStore();
  const [title, setTitle] = React.useState<string>(item.title);
  const [textContent, setTextContent] = React.useState<string>(item.text);
  const [hasEdited, setHasEdited] = React.useState<boolean>(false);

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

  const handleDelete = async () => {
    try {
      await deleteMemory(item.id);
      router.back();
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              clearMessageHistory();
              router.back();
            }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Notes</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000000" />
          ) : (
            <>
              {hasEdited ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleSave()}>
                  <Ionicons name="checkmark" size={24} color="#000000" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete()}>
                  <Ionicons name="trash" size={24} color="#000000" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <View style={styles.titleContainer}>
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
        </View>
        <View style={styles.content}>
          <TextInput
            style={styles.text}
            multiline={true}
            value={textContent}
            onChangeText={text => {
              setTextContent(text);
              setHasEdited(true);
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4B4B4B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
    color: '#000000',
  },
  titleContainer: {
    padding: 16,
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
  content: {
    padding: 16,
  },
  text: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'MonaSans-Regular',
    lineHeight: 28,
  },
  thinking: {
    color: '#A1887F',
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,

  },
});

export default DetailsPage;
