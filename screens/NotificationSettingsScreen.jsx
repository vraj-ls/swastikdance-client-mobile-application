import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import authService from '../services/authService';
import { API_URL } from '../constants/config';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const PREFS_STORAGE_KEY = 'notification_prefs';

const DEFAULT_PREFS = {
  sessionReminders:  true,
  enrolmentUpdates:  true,
  announcements:     true,
  birthdayGreetings: true,
};

export default function NotificationSettingsScreen() {
  const [loading, setLoading]     = useState(true);
  const [systemGranted, setSystemGranted] = useState(true);
  const [prefs, setPrefs]         = useState(DEFAULT_PREFS);

  // Check system-level notification permission
  const checkSystemPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setSystemGranted(status === 'granted');
  }, []);

  // Fetch preferences from backend, fall back to AsyncStorage if offline
  const fetchPrefs = useCallback(async () => {
    try {
      const token = await authService.getToken();
      const response = await axios.get(`${API_URL}/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success) {
        const fetched = response.data.payload;
        setPrefs(fetched);
        await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(fetched));
        return;
      }
    } catch (_) {
      // Network error — fall through to AsyncStorage
    }

    // Offline fallback
    try {
      const cached = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
      if (cached) setPrefs(JSON.parse(cached));
    } catch (_) {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    Promise.all([checkSystemPermission(), fetchPrefs()]).finally(() =>
      setLoading(false)
    );
  }, [checkSystemPermission, fetchPrefs]);

  const savePrefs = useCallback(async (updated) => {
    // Optimistic update
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));

    try {
      const token = await authService.getToken();
      await axios.put(`${API_URL}/notification-preferences`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('[NotificationSettings] Failed to save preferences to server:', err.message);
    }
  }, []);

  const togglePref = useCallback((key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    savePrefs(updated);
  }, [prefs, savePrefs]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* System permission row */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PUSH NOTIFICATIONS</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Push Notifications</Text>
            <Text style={styles.rowSubtitle}>
              {systemGranted
                ? 'Notifications are enabled for this app'
                : 'Tap to enable in device settings'}
            </Text>
          </View>
          <Switch
            value={systemGranted}
            onValueChange={() => Linking.openSettings()}
            trackColor={{ false: colors.divider, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Per-type preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>

        <PrefRow
          title="Session Reminders"
          subtitle="Get notified before upcoming classes"
          value={prefs.sessionReminders}
          disabled={!systemGranted}
          onToggle={() => togglePref('sessionReminders')}
        />
        <PrefRow
          title="Enrolment Updates"
          subtitle="Receipts and renewal notices"
          value={prefs.enrolmentUpdates}
          disabled={!systemGranted}
          onToggle={() => togglePref('enrolmentUpdates')}
        />
        <PrefRow
          title="Announcements"
          subtitle="General news and updates"
          value={prefs.announcements}
          disabled={!systemGranted}
          onToggle={() => togglePref('announcements')}
        />
        <PrefRow
          title="Birthday Greetings"
          subtitle="Receive a birthday message from us"
          value={prefs.birthdayGreetings}
          disabled={!systemGranted}
          onToggle={() => togglePref('birthdayGreetings')}
        />
      </View>
    </ScrollView>
  );
}

function PrefRow({ title, subtitle, value, disabled, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, disabled && styles.disabledText]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value && !disabled}
        disabled={disabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.divider, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disabledText: {
    color: colors.textTertiary,
  },
});
