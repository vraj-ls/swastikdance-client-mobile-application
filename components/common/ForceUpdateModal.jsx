import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function ForceUpdateModal({ visible, storeUrls = {} }) {
  const handleUpdate = () => {
    const url =
      Platform.OS === 'ios'
        ? storeUrls.ios
        : storeUrls.android;

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to Play Store web URL if deep link fails
        Linking.openURL('https://play.google.com/store/apps/details?id=com.swastikdance.app');
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🔄</Text>
          </View>

          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            A new version of Swastik Dance is available. Please update to
            continue using the app.
          </Text>

          <Button
            onPress={handleUpdate}
            variant="secondary"
            style={styles.button}
          >
            Update Now
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
});
