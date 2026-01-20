import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import authService from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'MALE',
    street: '',
    suburb: '',
    postcode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, dob, gender } = formData;

    if (!firstName || !lastName || !email || !phone || !dob || !gender) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('=== REGISTRATION REQUEST ===');
      console.log('Form Data:', JSON.stringify({ ...formData, email: email.toLowerCase() }, null, 2));

      const response = await authService.register({
        ...formData,
        email: email.toLowerCase(),
      });

      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Full Response:', JSON.stringify(response, null, 2));

      // Show password to user
      if (response.payload.password) {
        console.log('Registration successful, showing password to user');
        Alert.alert(
          'Registration Successful',
          `Your account has been created!\n\nYour password has been sent to your email: ${response.payload.password}\n\nPlease save this password.`,
          [{
            text: 'OK',
            onPress: () => {
              console.log('Navigating to WebView after registration...');
              navigation.replace('WebView');
            }
          }]
        );
      } else {
        console.log('Navigating to WebView after registration...');
        navigation.replace('WebView');
      }
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error:', error);
      Alert.alert('Registration Failed', error || 'Unable to create account');
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
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>
              or{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Login')}
              >
                login to your account
              </Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={formData.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="john.doe@email.com"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+61412345678"
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="1995-05-15"
                value={formData.dob}
                onChangeText={(value) => handleChange('dob', value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                  enabled={!loading}
                  style={styles.picker}
                >
                  <Picker.Item label="Male" value="MALE" />
                  <Picker.Item label="Female" value="FEMALE" />
                  <Picker.Item label="Other" value="OTHER" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St"
                value={formData.street}
                onChangeText={(value) => handleChange('street', value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Suburb</Text>
              <TextInput
                style={styles.input}
                placeholder="Sydney"
                value={formData.suburb}
                onChangeText={(value) => handleChange('suburb', value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postcode</Text>
              <TextInput
                style={styles.input}
                placeholder="2000"
                value={formData.postcode}
                onChangeText={(value) => handleChange('postcode', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  content: {
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  link: {
    color: '#FF10F0',
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#FF10F0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
