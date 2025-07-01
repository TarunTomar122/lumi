import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getResponsiveSize } from '@/utils/responsive';

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

interface UsageChartProps {
  usageData: AppUsage[];
  hasPermission?: boolean;
  onRequestPermission?: () => void;
}

const formatAppName = (name: string) => {
  // Remove common prefixes
  let formattedName = name.replace(/^(com\.|android\.|google\.android\.apps\.)/, '');

  // Split by dots and get the last meaningful part
  formattedName = formattedName.split('.').pop() || formattedName;

  // Convert to Title Case and remove special characters
  return formattedName
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const UsagePermissionRequest: React.FC<{ onRequestPermission: () => void }> = ({ onRequestPermission }) => {
  const { colors, createThemedStyles } = useTheme();

  const styles = createThemedStyles((colors) => ({
    container: {
      padding: getResponsiveSize(20),
      backgroundColor: colors.card,
      marginVertical: getResponsiveSize(12),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: getResponsiveSize(50),
      borderRadius: 6,
      alignItems: 'center',
    },
    icon: {
      marginBottom: getResponsiveSize(16),
    },
    title: {
      fontSize: getResponsiveSize(18),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: getResponsiveSize(8),
    },
    description: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: getResponsiveSize(20),
      lineHeight: getResponsiveSize(20),
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: getResponsiveSize(24),
      paddingVertical: getResponsiveSize(12),
      borderRadius: 6,
    },
    buttonText: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Medium',
      color: colors.background,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons 
          name="bar-chart-outline" 
          size={getResponsiveSize(48)} 
          color={colors.textSecondary} 
        />
      </View>
      <Text style={styles.title}>App Usage Insights</Text>
      <Text style={styles.description}>
        Allow Lumi to access your app usage data to show you insights about your most used apps and screen time.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
        <Text style={styles.buttonText}>Allow Access</Text>
      </TouchableOpacity>
    </View>
  );
};

export const UsageChart: React.FC<UsageChartProps> = ({ 
  usageData, 
  hasPermission = true, 
  onRequestPermission 
}) => {
  const { colors, createThemedStyles, isDark } = useTheme();

  // Show permission request if we don't have permission
  if (hasPermission === false && onRequestPermission) {
    return <UsagePermissionRequest onRequestPermission={onRequestPermission} />;
  }

  // Don't render anything if we don't have data or permission is unknown
  if (!hasPermission || usageData.length === 0) {
    return null;
  }

  const totalTime = usageData.reduce((sum, app) => sum + app.totalTimeInForeground, 0);

  const styles = createThemedStyles((colors) => ({
    container: {
      padding: 20,
      backgroundColor: colors.card,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 50,
      borderRadius: 6,
    },
    title: {
      fontSize: 20,
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginBottom: 20,
    },
    barContainer: {
      marginBottom: 16,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    appName: {
      fontSize: 15,
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    percentage: {
      fontSize: 14,
      fontFamily: 'MonaSans-Medium',
      color: colors.textSecondary,
    },
    time: {
      fontSize: 14,
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
    },
    barWrapper: {
      height: 12,
      backgroundColor: colors.divider,
      borderRadius: 6,
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      borderRadius: 6,
      position: 'relative',
    },
    barGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    totalTime: {
      fontSize: 14,
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      marginTop: 8,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Most used apps</Text>
      <Text style={styles.subtitle}>Last 24 hours</Text>
      {usageData.map((app, index) => {
        const percentage = Math.round((app.totalTimeInForeground / totalTime) * 100);
        return (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barHeader}>
              <Text style={styles.appName} numberOfLines={1}>
                {formatAppName(app.appName)}
              </Text>
              <View style={styles.timeContainer}>
                <Text style={styles.percentage}>{percentage}%</Text>
                <Text style={styles.time}>{Math.round(app.totalTimeInForeground / 60)} min</Text>
              </View>
            </View>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${percentage}%`,
                    backgroundColor: `hsl(${index * 60}, 80%, 75%)`,
                    opacity: isDark ? 0.8 : 1,
                  },
                ]}>
                <View style={styles.barGlow} />
              </View>
            </View>
          </View>
        );
      })}
      <Text style={styles.totalTime}>Total screen time: {Math.round(totalTime / 60)} min</Text>
    </View>
  );
};
