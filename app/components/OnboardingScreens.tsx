import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';

interface OnboardingScreensProps {
  onComplete: (username: string) => void;
}

export const OnboardingScreens: React.FC<OnboardingScreensProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = React.useState(0);
  const [username, setUsername] = React.useState('');
  const { setOnboardingComplete } = useUserStore();

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setCurrentScreen(1);
    }
  };

  const handleSkipTour = async () => {
    await setOnboardingComplete(username);
    onComplete(username);
  };

  const handleNext = () => {
    if (currentScreen < 4) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleSkipTour();
    }
  };

  const renderUsernameScreen = () => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="sparkles" size={48} color="#000000" style={styles.icon} />
          <Text style={styles.title}>Welcome to Lumi</Text>
          <Text style={styles.subtitle}>What should we call you?</Text>

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            autoFocus
            onSubmitEditing={handleUsernameSubmit}
          />

          <TouchableOpacity
            style={[styles.button, !username.trim() && styles.buttonDisabled]}
            onPress={handleUsernameSubmit}
            disabled={!username.trim()}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderFeatureScreen = (
    title: string,
    description: string,
    mockupComponent: React.ReactNode,
    isLast: boolean = false
  ) => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>

          <View style={styles.mockupContainer}>{mockupComponent}</View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipTour}>
            <Text style={styles.skipText}>Skip Tour</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{isLast ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const TasksMockup = () => (
    <View style={styles.mockup}>
      <View style={styles.mockupHeader}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.mockupHeaderText}>Tasks</Text>
      </View>
      <View style={styles.mockupContent}>
        <View style={styles.taskItem}>
          <View style={styles.taskContent}>
            <Text style={styles.taskText}>Buy groceries</Text>
            <Text style={styles.taskDate}>Today, 6:00 PM</Text>
          </View>
          <View style={styles.checkbox} />
        </View>
        <View style={styles.taskItem}>
          <View style={styles.taskContent}>
            <Text style={styles.taskText}>Call mom</Text>
            <Text style={styles.taskDate}>Tomorrow, 2:00 PM</Text>
          </View>
          <View style={styles.checkbox} />
        </View>
        <View style={styles.taskItem}>
          <View style={styles.taskContent}>
            <Text style={[styles.taskText, styles.completedTask]}>Morning workout</Text>
            <Text style={styles.taskDate}>Today, 7:00 AM</Text>
          </View>
          <View style={[styles.checkbox, styles.checkedBox]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
      <View style={styles.mockupInput}>
        <Text style={styles.inputPlaceholder}>do this at 9pm tom</Text>
      </View>
    </View>
  );

  const NotesMockup = () => (
    <View style={styles.mockup}>
      <View style={styles.mockupHeader}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.mockupHeaderText}>Notes</Text>
      </View>
      <View style={styles.tagsList}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>personal</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>work</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>ideas</Text>
        </View>
      </View>
      <View style={styles.mockupContent}>
        <View style={styles.noteItem}>
          <Text style={styles.noteTitle}>Weekend trip ideas</Text>
          <Text style={styles.notePreview}>Maybe visit the mountains or...</Text>
        </View>
        <View style={styles.noteItem}>
          <Text style={styles.noteTitle}>Book recommendations</Text>
          <Text style={styles.notePreview}>Fiction: The Seven Husbands of...</Text>
        </View>
        <View style={styles.noteItem}>
          <Text style={styles.noteTitle}>Recipe for pasta</Text>
          <Text style={styles.notePreview}>Ingredients: tomatoes, basil...</Text>
        </View>
      </View>
      <View style={styles.mockupInput}>
        <Text style={styles.inputPlaceholder}>personal: note about something</Text>
      </View>
    </View>
  );

  const HabitsMockup = () => (
    <View style={styles.mockup}>
      <View style={styles.mockupHeader}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.mockupHeaderText}>Habits</Text>
      </View>
      <View style={styles.mockupContent}>
        <View style={styles.habitItem}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitTitle}>Morning meditation</Text>
            <Ionicons name="chevron-down" size={20} color="#000000" />
          </View>
          <View style={styles.habitProgress}>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>M</Text>
              <View style={[styles.circle, styles.completedCircle]} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>T</Text>
              <View style={[styles.circle, styles.completedCircle]} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>W</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>T</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>F</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>S</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>S</Text>
              <View style={styles.circle} />
            </View>
          </View>
        </View>
        <View style={styles.habitItem}>
          <View style={styles.habitHeader}>
            <Text style={styles.habitTitle}>Running</Text>
            <Ionicons name="chevron-down" size={20} color="#000000" />
          </View>
          <View style={styles.habitProgress}>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>M</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>T</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>W</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>T</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>F</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>S</Text>
              <View style={styles.circle} />
            </View>
            <View style={styles.dayColumn}>
              <Text style={styles.dayLabel}>S</Text>
              <View style={styles.circle} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.addHabitButton}>
        <Ionicons name="add-circle-outline" size={32} color="#000000" style={styles.addIcon} />
      </View>
    </View>
  );

  const ReflectionsMockup = () => (
    <View style={styles.mockup}>
      <View style={styles.mockupHeader}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.mockupHeaderText}>Reflections</Text>
      </View>
      <View style={styles.promptSection}>
        <Text style={styles.promptLabel}>Try this prompt?</Text>
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>What was the best thing you saw on your phone or computer today?</Text>
          <Ionicons name="refresh" size={20} color="#666666" />
        </View>
      </View>
      <View style={styles.mockupContent}>
        <View style={styles.reflectionItem}>
          <Text style={styles.reflectionDate}>May 21, 2025</Text>
          <Text style={styles.reflectionPreview}>
            prompt: What's one thing you created or accomplished today that made you feel good?...
          </Text>
        </View>
        <View style={styles.reflectionItem}>
          <Text style={styles.reflectionDate}>May 20, 2025</Text>
          <Text style={styles.reflectionPreview}>
            Today was a good day. I managed to finish my morning routine...
          </Text>
        </View>
      </View>
      <View style={styles.mockupInput}>
        <Text style={styles.inputPlaceholder}>reflection</Text>
        <Ionicons name="mic" size={20} color="#666666" />
      </View>
    </View>
  );

  if (currentScreen === 0) {
    return renderUsernameScreen();
  }

  const screens = [
    {
      title: 'Manage Your Tasks',
      description:
        "Add tasks with natural language. Say 'do this at 9pm tomorrow' and Lumi will understand the time and date automatically.",
      component: <TasksMockup />,
    },
    {
      title: 'Organize Your Notes',
      description:
        "Capture thoughts and ideas with tags. Use 'personal: note content' to automatically organize your notes by category.",
      component: <NotesMockup />,
    },
    {
      title: 'Track Your Habits',
      description:
        'Build consistent routines by tracking daily habits. See your progress at a glance with weekly views.',
      component: <HabitsMockup />,
    },
    {
      title: 'Daily Reflections',
      description:
        'End each day with mindful reflection. Capture your thoughts, learnings, and gratitude in a private journal.',
      component: <ReflectionsMockup />,
    },
  ];

  const currentScreenData = screens[currentScreen - 1];

  return renderFeatureScreen(
    currentScreenData.title,
    currentScreenData.description,
    currentScreenData.component,
    currentScreen === 4
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 40,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 18,
    fontFamily: 'MonaSans-Regular',
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'MonaSans-Medium',
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 28,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    lineHeight: 24,
    marginBottom: 32,
  },
  mockupContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },

  // Mockup styles
  mockup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  mockupHeaderText: {
    fontSize: 20,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
  },
  mockupContent: {
    gap: 12,
    marginBottom: 16,
    padding: 8,
  },
  mockupInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputPlaceholder: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#999999',
  },

  // Task mockup styles
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskDate: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: '#000000',
  },

  // Notes mockup styles
  tagsList: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  noteItem: {
    paddingVertical: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },

  // Habits mockup styles
  habitItem: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitTitle: {
    fontSize: 20,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  habitProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#666666',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF0F3',
  },
  completedCircle: {
    backgroundColor: '#FFB3BA',
  },

  // Reflections mockup styles
  reflectionItem: {
    paddingVertical: 8,
  },
  reflectionDate: {
    fontSize: 14,
    fontFamily: 'MonaSans-Medium',
    color: '#000000',
    marginBottom: 4,
  },
  reflectionPreview: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    lineHeight: 18,
  },

  // New styles for the updated mockups
  promptSection: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  promptLabel: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
    marginBottom: 8,
  },
  promptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#000000',
  },
  addHabitButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: '#666666',
  },
});
