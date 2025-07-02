import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getResponsiveSize, getResponsiveHeight } from '../../utils/responsive';
import { UpdateInfo, dismissUpdate } from '../../utils/versionChecker';
import { Linking } from 'react-native';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, updateInfo, onClose, onDismiss }) => {
  const { colors, createThemedStyles } = useTheme();

  const handleUpdate = () => {
    if (updateInfo?.storeUrl) {
      Linking.openURL(updateInfo.storeUrl);
    }
    onClose();
  };

  const handleDismiss = async () => {
    if (updateInfo?.latestVersion) {
      await dismissUpdate(updateInfo.latestVersion);
    }
    onDismiss();
  };

  if (!updateInfo || !updateInfo.updateAvailable) {
    return null;
  }

  const styles = createThemedStyles((colors) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: getResponsiveSize(20),
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: getResponsiveSize(16),
      width: '100%',
      maxWidth: getResponsiveSize(400),
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      padding: getResponsiveSize(24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: getResponsiveSize(16),
      right: getResponsiveSize(16),
      padding: getResponsiveSize(8),
      borderRadius: getResponsiveSize(20),
      backgroundColor: colors.surface,
    },
    headerIcon: {
      width: getResponsiveSize(60),
      height: getResponsiveSize(60),
      borderRadius: getResponsiveSize(30),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: getResponsiveHeight(16),
    },
    headerTitle: {
      fontSize: getResponsiveSize(24),
      fontFamily: 'MonaSans-SemiBold',
      color: colors.text,
      marginBottom: getResponsiveHeight(8),
      textAlign: 'center',
    },
    versionText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: getResponsiveSize(24),
    },
    noteItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: getResponsiveHeight(16),
      paddingRight: getResponsiveSize(8),
    },
    noteText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Regular',
      color: colors.text,
      lineHeight: getResponsiveSize(24),
      flex: 1,
    },
    footer: {
      padding: getResponsiveSize(24),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: getResponsiveSize(12),
    },
    dismissButton: {
      flex: 1,
      paddingVertical: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(12),
      borderRadius: getResponsiveSize(12),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dismissButtonText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Medium',
      color: colors.text,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(12),
      borderRadius: getResponsiveSize(12),
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: getResponsiveSize(16),
      fontFamily: 'MonaSans-Medium',
      color: colors.primaryText,
    },
    thankYouText: {
      fontSize: getResponsiveSize(14),
      fontFamily: 'MonaSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: getResponsiveHeight(16),
      lineHeight: getResponsiveSize(20),
    },
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={getResponsiveSize(20)} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerIcon}>
              <Ionicons name="download-outline" size={getResponsiveSize(28)} color={colors.primaryText} />
            </View>
            
            <Text style={styles.headerTitle}>Update Available!</Text>
            <Text style={styles.versionText}>
              {updateInfo.currentVersion} → {updateInfo.latestVersion}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollContent}>
              <View style={styles.noteItem}>
                <Text style={styles.noteText}>
                  🚀 A new version of Lumi is available with exciting features and improvements!
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.thankYouText}>
              Update now to get new features and improvements!
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                <Text style={styles.dismissButtonText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleUpdate}>
                <Text style={styles.actionButtonText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 