import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import authService from '../services/authService';
import Button from '../components/common/Button';
import TextInput from '../components/common/TextInput';
import BottomSheet from '../components/layouts/BottomSheet';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function AddStudentScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleDateChange = (_event, date) => {
    if (date) {
      setSelectedDate(date);
      // Format date in local timezone to avoid timezone offset issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData({ ...formData, dob: formattedDate });
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleGenderSelect = (gender) => {
    setFormData({ ...formData, gender });
    setShowGenderSheet(false);
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return;
    }

    if (!formData.dob) {
      Alert.alert('Error', 'Date of birth is required');
      return;
    }

    if (!formData.gender) {
      Alert.alert('Error', 'Please select a gender');
      return;
    }

    setLoading(true);
    try {
      await authService.addStudent({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        notes: formData.notes.trim(),
      });

      Alert.alert(
        'Success',
        'Student added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
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
          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <TextInput
              label="First Name *"
              placeholder="John"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              editable={!loading}
            />

            {/* Middle Name */}
            <TextInput
              label="Middle Name"
              placeholder="Fred"
              value={formData.middleName}
              onChangeText={(text) => setFormData({ ...formData, middleName: text })}
              editable={!loading}
            />

            {/* Last Name */}
            <TextInput
              label="Last Name *"
              placeholder="Doe"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              editable={!loading}
            />

            {/* Date of Birth */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <View style={styles.dropdownContent}>
                  <Text style={[styles.dateText, !formData.dob && styles.placeholderText]}>
                    {formData.dob ? formatDateDisplay(formData.dob) : 'Select date'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Date Picker Bottom Sheet */}
            <BottomSheet
              isVisible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              title="Select Date of Birth"
            >
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor={colors.textPrimary}
                />
              </View>

              <Button
                title="Done"
                onPress={() => {
                  if (formData.dob) {
                    setShowDatePicker(false);
                  }
                }}
              />
            </BottomSheet>

            {/* Gender */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderSheet(true)}
                disabled={loading}
              >
                <View style={styles.dropdownContent}>
                  <Text style={[styles.dateText, !formData.gender && styles.placeholderText]}>
                    {formData.gender || 'Select gender'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Gender Bottom Sheet */}
            <BottomSheet
              isVisible={showGenderSheet}
              onClose={() => setShowGenderSheet(false)}
              title="Select Gender"
            >
              <TouchableOpacity
                style={styles.bottomSheetOption}
                onPress={() => handleGenderSelect('Female')}
              >
                <Text style={styles.bottomSheetOptionText}>Female</Text>
                {formData.gender === 'Female' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <View style={styles.bottomSheetDivider} />

              <TouchableOpacity
                style={styles.bottomSheetOption}
                onPress={() => handleGenderSelect('Male')}
              >
                <Text style={styles.bottomSheetOptionText}>Male</Text>
                {formData.gender === 'Male' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowGenderSheet(false)}
              />
            </BottomSheet>

            {/* Allergies or Medical Conditions */}
            <TextInput
              label="Allergies or Medical Conditions"
              placeholder="Allergies, conditions, etc."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
              editable={!loading}
            />

            {/* Add Student Button */}
            <Button
              title="Add Student"
              onPress={handleAddStudent}
              disabled={loading}
              loading={loading}
            />
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'flex-start',
  },
  form: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md - 4,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  datePickerWrapper: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownIcon: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg - 6,
    paddingHorizontal: spacing.lg - 4,
  },
  bottomSheetOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg - 4,
  },
});
