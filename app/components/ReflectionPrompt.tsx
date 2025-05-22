import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PROMPTS = [
  "Describe one specific moment today that made you smile - what exactly happened?",
  "Which person did you enjoy spending time with today and what did you do together?",
  "What was the most enjoyable activity you did today and why did it stand out?",
  "Tell me about one small interaction today that lifted your mood",
  "What was the best part of your morning/afternoon/evening today?",
  "Describe a moment of connection you had with someone today",
  "What was the most peaceful moment in your day?",
  "What's one thing you created or accomplished today that made you feel good?",
  "Who did something kind for you today and what did they do?",
  "What was the most interesting conversation you had today?",
  "Describe a moment today when you felt truly present and engaged",
  "What was the most beautiful thing you noticed today?",
];

interface ReflectionPromptProps {
  onPromptSelect: (prompt: string) => void;
  selectedPrompt?: string;
}

export const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({ onPromptSelect, selectedPrompt }) => {
  const [currentPrompt, setCurrentPrompt] = React.useState(() => 
    PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  );

  const getNewPrompt = () => {
    let newPrompt = currentPrompt;
    while (newPrompt === currentPrompt) {
      newPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    }
    setCurrentPrompt(newPrompt);
  };

  const isSelected = selectedPrompt === currentPrompt;

  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPromptSelect(currentPrompt)}
    >
      <View style={styles.content}>
        <Text style={[styles.promptText, isSelected && styles.selectedPromptText]}>{currentPrompt}</Text>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            getNewPrompt();
          }}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.tapHint, isSelected && styles.selectedTapHint]}>
        {isSelected ? 'Prompt selected' : 'Tap to use this prompt'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedContainer: {
    backgroundColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    flex: 1,
    lineHeight: 22,
  },
  selectedPromptText: {
    color: '#000000',
    fontFamily: 'MonaSans-Medium',
  },
  refreshButton: {
    padding: 4,
  },
  tapHint: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    marginTop: 8,
  },
  selectedTapHint: {
    color: '#000000',
  },
}); 