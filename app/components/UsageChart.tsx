import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AppUsage {
  appName: string;
  totalTimeInForeground: number;
}

interface UsageChartProps {
  usageData: AppUsage[];
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

export const UsageChart: React.FC<UsageChartProps> = ({ usageData }) => {
  const totalTime = usageData.reduce((sum, app) => sum + app.totalTimeInForeground, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top apps today</Text>
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 50
  },
  title: {
    fontSize: 20,
    fontFamily: 'MonaSans-SemiBold',
    color: '#1A1A1A',
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
    color: '#333333',
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
    color: '#666666',
  },
  time: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    color: '#666666',
  },
  barWrapper: {
    height: 12,
    backgroundColor: '#F5F5F5',
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
    color: '#666666',
    marginTop: 8,
  },
});
