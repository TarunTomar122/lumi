import { TextInput, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Ionicons } from '@expo/vector-icons';

export default function InputContainer({
  userResponse,
  setUserResponse,
  handleSubmit,
  isRecording,
  setIsRecording,
  isThinking,
}: {
  userResponse: string;
  setUserResponse: (text: string) => void;
  handleSubmit: () => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}) {
  const processedResultsRef = React.useRef<Set<string>>(new Set());
  const { state, startRecognizing, stopRecognizing, resetState } = useVoiceRecognition();

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (state.error) {
      console.log('Error:', state.error);
      resetState();
      setIsRecording(false);
    }
  }, [state.error]);

  React.useEffect(() => {
    // console.log('Recording results:', state.results, isRecording);
    if (state.results[0] && !isRecording) {
      // Only process results when stopping recording
      // Check if we've already processed this result
      const resultString = state.results[0];
      if (!processedResultsRef.current.has(resultString)) {
        processedResultsRef.current.add(resultString);

        // remove any leading or trailing whitespace
        setUserResponse(resultString.trim());
      }
    }
  }, [state.results, isRecording]);

  return (
    <View style={[styles.inputContainer]}>
      <TextInput
        style={styles.textInput}
        placeholder={isRecording ? 'Listening...' : 'Ask anything'}
        placeholderTextColor="#A1887F"
        onChangeText={setUserResponse}
        value={userResponse}
        multiline={true}
        numberOfLines={4}
      />
      <TouchableOpacity
        style={styles.micButton}
        onPress={() => {
          if (userResponse) {
            handleSubmit();
            setUserResponse('');
          } else if (isRecording) {
            stopRecognizing();
            setIsRecording(false);
            // Don't automatically submit - let user review and send manually
          } else {
            startRecognizing();
            setIsRecording(true);
            // Clear any previous results when starting new recording
            processedResultsRef.current.clear();
          }
        }}>
        {loading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : userResponse ? (
          <Ionicons name="send" size={26} color="#000000" />
        ) : (
          <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={26} color="#000000" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'MonaSans-Medium',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  micButton: {
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
  },
});
