import React from 'react';
import { Modal, View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function ForceUpdateModal({ visible, storeUrls = {} }) {
  const handleUpdate = () => {
    const url = Platform.OS === 'ios' ? storeUrls.ios : storeUrls.android;
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL('https://play.google.com/store/apps/details?id=com.swastikdance.app');
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            A new version of Swastik Dance is available. Please update to continue using the app.
          </Text>
          <Button onPress={handleUpdate} variant="secondary" style={styles.button}>
            Update Now
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popup: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    width: '100%',
  },
});
