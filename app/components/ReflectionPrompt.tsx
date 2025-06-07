import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PROMPTS = [
  'Describe one specific moment today that made you smile - what exactly happened?',
  'Which person did you enjoy spending time with today and what did you do together?',
  'What was the most enjoyable activity you did today and why did it stand out?',
  'Tell me about one small interaction today that lifted your mood',
  'What was the best part of your morning/afternoon/evening today?',
  'Describe a moment of connection you had with someone today',
  'What was the most peaceful moment in your day?',
  "What's one thing you created or accomplished today that made you feel good?",
  'Who did something kind for you today and what did they do?',
  'What was the most interesting conversation you had today?',
  'Describe a moment today when you felt truly present and engaged',
  'What was the most beautiful thing you noticed today?',
  'What made you laugh out loud today?',
  'Which meal or snack did you really enjoy today and why?',
  'What was the most comfortable moment of your day?',
  'Describe a time today when you felt proud of yourself',
  'What unexpected good thing happened to you today?',
  'Which song, sound, or voice made you feel good today?',
  'What was the most satisfying task you completed today?',
  'Tell me about a moment today when you felt loved or cared for',
  'What was the nicest compliment you received or gave today?',
  'Describe something you learned today that interested you',
  'What was the most relaxing part of your day?',
  'Which text message or call made you happy today?',
  'What was the best thing you saw on your phone or computer today?',
  'Describe a moment today when you felt grateful for your health',
  'What was the most delicious thing you tasted today?',
  'Tell me about a time today when you helped someone or they helped you',
  'What was the most inspiring thing you read or heard today?',
  'Describe a moment today when you felt content with where you are',
  'What was the best weather moment you experienced today?',
  'Which small luxury or comfort did you appreciate today?',
  'What was the most fun thing you did today, even if it was brief?',
  'Describe a moment today when you felt thankful for technology',
  'What was the kindest thing you witnessed today?',
  'Tell me about something that worked out better than expected today',
  'What was the most energizing part of your day?',
  'Describe a moment today when you felt grateful for your home',
  'What was the best surprise you had today, no matter how small?',
  'Which memory from today will you want to remember next week?',
  'What was the most thoughtful thing someone did for you today?',
  'Describe a moment today when you felt lucky or fortunate',
  'What was the most creative thing you did or saw today?',
  'Tell me about a time today when you felt genuinely happy',
  'What was the most useful thing you discovered or figured out today?',
  'Describe something about today that exceeded your expectations',
  'What was the most meaningful conversation or exchange you had today?',
  'Which moment today reminded you of something you love about life?',
  'What was the best decision you made today, big or small?',
  'Describe a time today when you felt grateful for the people in your life'
];

interface ReflectionPromptProps {
  onPromptSelect: (prompt: string) => void;
  selectedPrompt?: string;
}

export const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({
  onPromptSelect,
  selectedPrompt,
}) => {
  const [currentPrompt, setCurrentPrompt] = React.useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
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
    <View
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onPromptSelect(currentPrompt)}>
      <Text style={[styles.tapHint]}>
        Try this prompt?
      </Text>
      <View style={styles.content}>
        <Text style={[styles.promptText, isSelected && styles.selectedPromptText]}>
          {currentPrompt}
        </Text>
        <TouchableOpacity
          onPress={e => {
            e.stopPropagation();
            getNewPrompt();
          }}
          style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    marginBottom: 8,
  },
  selectedTapHint: {
    color: '#000000',
  },
});
