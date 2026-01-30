import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Edit, Lock, Bell, HelpCircle, Info, LogOut, ChevronRight, UserPlus } from 'lucide-react-native';
import { Button } from '../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import authService from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await authService.getUserProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format address from individual fields
  const getFormattedAddress = () => {
    if (!user) return '';
    const parts = [user.street, user.suburb, user.postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  // Get display name from email
  const getDisplayName = () => {
    if (!user || !user.email) return '';
    return user.email.split('@')[0];
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.clearAuth();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const ProfileOption = ({ icon: IconComponent, title, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionIcon, danger && styles.dangerIcon]}>
          <IconComponent
            color={danger ? colors.white : colors.primary}
            size={20}
          />
        </View>
        <Text style={[styles.optionTitle, danger && styles.dangerText]}>{title}</Text>
      </View>
      {showArrow && <ChevronRight color={colors.textTertiary} size={24} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button onPress={fetchProfile} variant="secondary">
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.email ? user.email.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{getDisplayName()}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{getFormattedAddress()}</Text>
          </View>
        </View>
      </View>

      {/* Options Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <ProfileOption
          icon={Edit}
          title="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <ProfileOption
          icon={Lock}
          title="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <ProfileOption
          icon={Bell}
          title="Notification Settings"
          onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
        />
        <ProfileOption
          icon={HelpCircle}
          title="Help & Support"
          onPress={() => Alert.alert('Help', 'Help & support coming soon')}
        />
        <ProfileOption
          icon={Info}
          title="About"
          onPress={() => Alert.alert('About', 'Swastik Dance App v1.0.0')}
        />
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <ProfileOption
          icon={LogOut}
          title="Logout"
          onPress={handleLogout}
          showArrow={false}
          danger={true}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Swastik Dance App v1.0.0</Text>
      </View>
    </ScrollView>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.white,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  userName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  infoRow: {
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dangerIcon: {
    backgroundColor: colors.error,
  },
  optionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
