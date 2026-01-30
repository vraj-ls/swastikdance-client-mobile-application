import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Button } from '../components/common/Button';
import { TextInput } from '../components/common/TextInput';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import authService from '../services/authService';

export default function EditProfileScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    street: '',
    suburb: '',
    postcode: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await authService.getUserProfile();
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        street: profile.street || '',
        suburb: profile.suburb || '',
        postcode: profile.postcode || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Validate required fields
    if (!formData.email || !formData.phone) {
      Alert.alert('Error', 'Email and phone are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      await authService.updateProfile(formData);
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email address *"
              placeholder="john.doe@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!saving}
            />

            <TextInput
              label="Phone number *"
              placeholder="0400 000 000"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={!saving}
            />

            <TextInput
              label="Street address"
              placeholder="123 Main Street"
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
              editable={!saving}
            />

            <TextInput
              label="Suburb"
              placeholder="Sydney"
              value={formData.suburb}
              onChangeText={(text) => setFormData({ ...formData, suburb: text })}
              editable={!saving}
            />

            <TextInput
              label="Postcode"
              placeholder="2000"
              value={formData.postcode}
              onChangeText={(text) => setFormData({ ...formData, postcode: text })}
              keyboardType="numeric"
              editable={!saving}
            />

            <Button
              onPress={handleUpdate}
              loading={saving}
              disabled={saving}
              variant="secondary"
              style={styles.button}
            >
              Update Profile
            </Button>
          </View>

          {/* Required fields note */}
          <Text style={styles.note}>* Required fields</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  form: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  note: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
