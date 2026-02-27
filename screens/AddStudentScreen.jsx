import React, { useState, useCallback, useMemo } from 'react';
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
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, TextInput } from '../components/common';
import { BottomSheet } from '../components/layouts';
import { useForm } from '../hooks';
import { validateRequired, validateDateOfBirth } from '../utils';
import { formatDateDisplay, formatDateInput } from '../utils';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import authService from '../services/authService';

const GENDER_OPTIONS = ['Female', 'Male'];

// Validation rules
const validationRules = {
  firstName: (value) => validateRequired(value?.trim(), 'First name'),
  lastName: (value) => validateRequired(value?.trim(), 'Last name'),
  dob: (value) => validateDateOfBirth(value),
  gender: (value) => validateRequired(value, 'Gender'),
};

const AddStudentScreen = ({ navigation }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form handling with custom hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useForm(
    {
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      gender: '',
      notes: '',
    },
    handleAddStudent,
    validationRules
  );

  // Handle date selection
  const handleDateChange = useCallback(
    (_event, date) => {
      if (date) {
        setSelectedDate(date);
        const formattedDate = formatDateInput(date);
        setFieldValue('dob', formattedDate);
      }
    },
    [setFieldValue]
  );

  // Handle gender selection
  const handleGenderSelect = useCallback(
    (gender) => {
      setFieldValue('gender', gender);
      setShowGenderSheet(false);
    },
    [setFieldValue]
  );

  // Submit handler
  async function handleAddStudent(formValues) {
    try {
      await authService.addStudent({
        firstName: formValues.firstName.trim(),
        middleName: formValues.middleName.trim(),
        lastName: formValues.lastName.trim(),
        dob: formValues.dob,
        gender: formValues.gender,
        notes: formValues.notes.trim(),
      });

      Alert.alert('Success', 'Student added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', error || 'Failed to add student');
      throw error; // Re-throw to let useForm handle the submission state
    }
  }

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Close date picker
  const closeDatePicker = useCallback(() => {
    if (values.dob) {
      setShowDatePicker(false);
    }
  }, [values.dob]);

  // Memoized display value for date
  const dateDisplayValue = useMemo(() => {
    return values.dob ? formatDateDisplay(values.dob) : 'Select date';
  }, [values.dob]);

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
          <View style={styles.form}>
            {/* First Name */}
            <TextInput
              label="First Name *"
              placeholder="John"
              value={values.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              onBlur={() => handleBlur('firstName')}
              error={touched.firstName && errors.firstName}
              editable={!isSubmitting}
            />

            {/* Middle Name */}
            <TextInput
              label="Middle Name"
              placeholder="Fred"
              value={values.middleName}
              onChangeText={(text) => handleChange('middleName', text)}
              onBlur={() => handleBlur('middleName')}
              editable={!isSubmitting}
            />

            {/* Last Name */}
            <TextInput
              label="Last Name *"
              placeholder="Doe"
              value={values.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              onBlur={() => handleBlur('lastName')}
              error={touched.lastName && errors.lastName}
              editable={!isSubmitting}
            />

            {/* Date of Birth */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  touched.dob && errors.dob && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={isSubmitting}
              >
                <View style={styles.dropdownContent}>
                  <Text
                    style={[
                      styles.dateText,
                      !values.dob && styles.placeholderText,
                    ]}
                  >
                    {dateDisplayValue}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </View>
              </TouchableOpacity>
              {touched.dob && errors.dob && (
                <Text style={styles.errorText}>{errors.dob}</Text>
              )}
            </View>

            {/* Date Picker Bottom Sheet */}
            <BottomSheet
              visible={showDatePicker}
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

              <Button title="Done" onPress={closeDatePicker} />
            </BottomSheet>

            {/* Gender */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  touched.gender && errors.gender && styles.inputError,
                ]}
                onPress={() => setShowGenderSheet(true)}
                disabled={isSubmitting}
              >
                <View style={styles.dropdownContent}>
                  <Text
                    style={[
                      styles.dateText,
                      !values.gender && styles.placeholderText,
                    ]}
                  >
                    {values.gender || 'Select gender'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </View>
              </TouchableOpacity>
              {touched.gender && errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            {/* Gender Bottom Sheet */}
            <BottomSheet
              visible={showGenderSheet}
              onClose={() => setShowGenderSheet(false)}
              title="Select Gender"
            >
              {GENDER_OPTIONS.map((gender, index) => (
                <React.Fragment key={gender}>
                  <TouchableOpacity
                    style={styles.bottomSheetOption}
                    onPress={() => handleGenderSelect(gender)}
                  >
                    <Text style={styles.bottomSheetOptionText}>{gender}</Text>
                    {values.gender === gender && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  {index < GENDER_OPTIONS.length - 1 && (
                    <View style={styles.bottomSheetDivider} />
                  )}
                </React.Fragment>
              ))}

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
              value={values.notes}
              onChangeText={(text) => handleChange('notes', text)}
              onBlur={() => handleBlur('notes')}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
            />

            {/* Add Student Button */}
            <Button
              title="Add Student"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
            />

            {/* Spacer */}
            <View style={{ height: 120 }} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

AddStudentScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

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
  inputError: {
    borderColor: colors.error,
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
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default AddStudentScreen;
