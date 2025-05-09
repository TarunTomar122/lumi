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
import InputContainer from './components/inputContainer';
import { clientTools } from '@/utils/tools';

const DetailsPage = () => {
  const router = useRouter();
  const { item: itemString } = useLocalSearchParams();
  const item = JSON.parse(itemString as string);

  const [userResponse, setUserResponse] = React.useState<string>('');
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [isThinking, setIsThinking] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const [textContent, setTextContent] = React.useState<string>(item.text);
  const [hasEdited, setHasEdited] = React.useState<boolean>(false);

  const handleTextChange = (text: string) => {
    setTextContent(text);
    setHasEdited(true);
  };

  const handleSave = () => {
    console.log('Updating memory:', textContent);
    setIsLoading(true);
    console.log('Updating memory:', textContent, item.id);
    clientTools
      .updateMemory({
        id: item.id,
        text: textContent,
        title: item.title,
        tags: item.tags || [],
      })
      .then(() => {
        setHasEdited(false);
        setIsLoading(false);
      })
      .catch((e: any) => {
        console.error('Error updating memory:', e);
        setIsLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
          </TouchableOpacity>
          <Text style={styles.title}>Memory</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#F5F5F5" />
          ) : (
            <>
              {hasEdited ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleSave()}>
                  <Ionicons name="checkmark" size={24} color="#F5F5F5" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={() => router.back()}>
                  <Ionicons name="trash" size={24} color="#F5F5F5" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {formatDate(item.due_date || item.reminder_date || item.date)}
          </Text>
        </View>
        <View style={styles.content}>
          <TextInput
            style={styles.text}
            multiline={true}
            value={textContent}
            onChangeText={handleTextChange}
          />
        </View>
        {isThinking && <Text style={styles.thinking}>Thinking...</Text>}
      </View>
      <View style={styles.inputContainer}>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={() => {}}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2B2B2B',
    paddingTop: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#2B2B2B',
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
    padding: 0,
  },
  title: {
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
    color: '#F5F5F5',
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
    color: '#F5F5F5',
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
