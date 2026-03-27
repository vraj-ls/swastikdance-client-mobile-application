import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { Button } from '../components/common/Button';
import { TextInput } from '../components/common/TextInput';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('=== LOGIN REQUEST ===');
      console.log('Email:', email.toLowerCase());

      // Get FCM token before login (if on physical device)
      const fcmToken = await notificationService.getTokenForLogin();
      console.log('FCM Token:', fcmToken ? 'obtained' : 'not available');

      const response = await authService.login(email.toLowerCase(), password, 'customer', fcmToken);

      console.log('=== LOGIN RESPONSE ===');
      console.log('Full Response:', JSON.stringify(response, null, 2));
      console.log('Success:', response.success);
      console.log('Token:', response.payload?.token);
      console.log('User:', JSON.stringify(response.payload?.user, null, 2));

      // After successful login, navigate to Main
      if (response.success) {
        console.log('Login successful, navigating to Main...');
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);
      Alert.alert('Login Failed', error || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>
              or{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Register')}
              >
                create a new account
              </Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email address"
              placeholder="john.doe@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              labelStyle={styles.inputLabel}
            />

            <TextInput
              label="Password"
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              labelStyle={styles.inputLabel}
            />

            <Button
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              variant="primary"
              style={styles.button}
            >
              LOGIN
            </Button>
          </View>

          {/* Forgot Password */}
          <View style={styles.footer}>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              Forgot password?
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl + 8,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.border,
  },
  link: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  form: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.background,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
});
