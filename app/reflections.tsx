import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import { useReflectionStore } from './store/reflectionStore';
import InputContainer from './components/inputContainer';
import { ReflectionPrompt } from './components/ReflectionPrompt';
import { getResponsiveSize, getResponsiveHeight } from '../utils/responsive';
import { useTheme } from '@/hooks/useTheme';

export default function Reflections() {
  const router = useRouter();
  const { colors, createThemedStyles } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [userResponse, setUserResponse] = React.useState('');
  const [selectedPrompt, setSelectedPrompt] = React.useState<string | undefined>();
  const [isRecording, setIsRecording] = React.useState(false);
  const { reflections, refreshReflections, addReflection } = useReflectionStore();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshReflections();
    } catch (error) {
      console.error('Error refreshing reflections:', error);
    }
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    refreshReflections();
  }, []);

  const formatDate = (dateStr: string) => {
    return DateTime.fromISO(dateStr).toFormat('MMMM d, yyyy');
  };

  // Parse content to separate prompt and response - same logic as in [id].tsx
  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const promptLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('prompt:'));
    
    if (promptLineIndex === -1) {
      return { prompt: '', response: content };
    }
    
    const prompt = lines[promptLineIndex].substring(7).trim(); // Remove "prompt:" and trim
    const response = lines.slice(promptLineIndex + 1).join('\n').trim();
    
    return { prompt, response };
  };

  const handleSubmit = async () => {
    if (!userResponse) return;

    let date = DateTime.now();
    let content = selectedPrompt ? `prompt: ${selectedPrompt}\n\n${userResponse}` : userResponse;

    // First split by colon
    const parts = userResponse.split(':');

    if (parts.length > 1) {
      // Everything before the first colon is potential date
      const datePart = parts[0].trim();
      // Everything after the first colon is content
      const responseContent = parts.slice(1).join(':').trim();

      // Now try to parse the date part - it can be either "2 apr" or "apr 2"
      const dateWords = datePart.split(/\s+/);

      // Get the last two words (in case there's text before the date)
      const lastTwo = dateWords.slice(-2);

      if (lastTwo.length === 2) {
        // Try all possible formats
        const formats = ['d MMMM', 'MMMM d', 'd MMM', 'MMM d'];
        let parsedDate = null;

        for (const format of formats) {
          const attempt = DateTime.fromFormat(lastTwo.join(' '), format);
          if (attempt.isValid) {
            parsedDate = attempt;
            break;
          }
        }

        if (parsedDate?.isValid) {
          date = parsedDate.set({ year: DateTime.now().year });
          content = selectedPrompt
            ? `prompt: ${selectedPrompt}\n\n${responseContent}`
            : responseContent;
        }
      }
    }

    await addReflection(date.toISODate() || '', content);
    setUserResponse('');
    setSelectedPrompt(undefined);
    refreshReflections();
  };

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt === selectedPrompt ? undefined : prompt);
  };

  const styles = createThemedStyles(colors => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: getResponsiveHeight(28),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getResponsiveSize(24),
      paddingTop: getResponsiveHeight(20),
      paddingBottom: getResponsiveHeight(10),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: getResponsiveSize(12),
    },
    backText: {
      fontSize: getResponsiveSize(24),
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
      marginBottom: getResponsiveSize(3),
    },
    container: {
      flex: 1,
      padding: getResponsiveSize(24),
    },
    noReflectionsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: getResponsiveHeight(100),
    },
    noReflectionsText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
    },
    reflectionsList: {
      flex: 1,
      marginTop: getResponsiveHeight(12),
    },
    reflectionItem: {
      marginBottom: getResponsiveHeight(16),
      paddingVertical: getResponsiveHeight(6),
      borderRadius: getResponsiveSize(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    reflectionDate: {
      fontSize: getResponsiveSize(18),
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
      marginBottom: getResponsiveHeight(8),
    },
    reflectionPreview: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      lineHeight: getResponsiveSize(22),
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={getResponsiveSize(28)} color={colors.text} />
          <Text style={styles.backText}>Reflections</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <ReflectionPrompt onPromptSelect={handlePromptSelect} selectedPrompt={selectedPrompt} />
        {reflections.length === 0 && (
          <View style={styles.noReflectionsContainer}>
            <Text style={styles.noReflectionsText}>No reflections yet.</Text>
            <Text style={styles.noReflectionsText}>Start by answering a prompt.</Text>
          </View>
        )}
        <ScrollView
          style={styles.reflectionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }>
          {reflections.map(reflection => {
            const { response } = parseContent(reflection.content);
            return (
              <TouchableOpacity
                key={reflection.id}
                style={styles.reflectionItem}
                onPress={() => router.push(`/reflection/${reflection.id}`)}>
                <Text style={styles.reflectionDate}>{formatDate(reflection.date)}</Text>
                <Text style={styles.reflectionPreview} numberOfLines={2}>
                  {response || reflection.content}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <InputContainer
          userResponse={userResponse}
          setUserResponse={setUserResponse}
          handleSubmit={handleSubmit}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          placeholder="Today was a good day"
        />
      </View>
    </SafeAreaView>
  );
}
