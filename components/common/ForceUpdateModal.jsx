import React from 'react';
import { Modal, View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
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

          {/* Orange accent header */}
          <View style={styles.accentBar}>
            <Text style={styles.accentIcon}>↑</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.subtitle}>
              A new version of Swastik Dance is available. Update now to get the latest features and improvements.
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Update Now</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popup: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  accentBar: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  body: {
    padding: spacing.xl,
    alignItems: 'center',
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
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
