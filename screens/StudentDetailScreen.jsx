import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import authService from '../services/authService';
import { Button, TextInput } from '../components/common';
import { BottomSheet } from '../components/layouts';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { S3_BUCKET_URL } from '../constants/config';

export default function StudentDetailScreen({ route, navigation }) {
  const { studentId } = route.params;

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    notes: '',
  });
  const [picture, setPicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const student = await authService.getStudent(studentId);

      console.log('📱 [MOBILE] Full student data:', JSON.stringify(student, null, 2));
      console.log('📱 [MOBILE] student.dob:', student.dob);
      console.log('📱 [MOBILE] student.dobISO:', student.dobISO);

      // Parse DOB from ISO format in local timezone to avoid timezone offset
      let dobDate = new Date();
      if (student.dobISO) {
        console.log('📱 [MOBILE] Parsing dobISO:', student.dobISO);
        const [year, month, day] = student.dobISO.split('-');
        console.log('📱 [MOBILE] Parsed parts - year:', year, 'month:', month, 'day:', day);
        dobDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        console.log('📱 [MOBILE] Created dobDate:', dobDate);
      }
      setSelectedDate(dobDate);

      const formDataToSet = {
        firstName: student.firstName || '',
        middleName: student.middleName || '',
        lastName: student.lastName || '',
        dob: student.dobISO || '',
        gender: student.gender || '',
        notes: student.notes || '',
      };

      console.log('📱 [MOBILE] Setting formData:', JSON.stringify(formDataToSet, null, 2));

      setFormData(formDataToSet);
      const pic = student.picture;
      setPicture(pic ? (pic.startsWith('http') ? pic : `${S3_BUCKET_URL}/${pic}`) : null);
    } catch (error) {
      console.error('Error fetching student details:', error);
      Alert.alert('Error', 'Failed to load student details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop().toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const previousPicture = picture;

    // Show the newly picked image immediately — avoids waiting for upload
    // and bypasses React Native's image cache (local URI is always fresh)
    setPicture(asset.uri);

    try {
      setUploadingPicture(true);
      const picturePath = await authService.uploadStudentPicture(studentId, asset.uri, contentType);
      // Append timestamp to bust the S3 cache so the confirmed URL also shows fresh
      setPicture(`${S3_BUCKET_URL}/${picturePath}?t=${Date.now()}`);
    } catch (error) {
      console.error('Error uploading picture:', error);
      setPicture(previousPicture); // revert on failure
      const msg = error?.message || String(error) || 'Failed to upload profile picture';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleUpdate = async () => {
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

    setSaving(true);
    try {
      await authService.updateStudent(studentId, {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob,
        gender: formData.gender,
        notes: formData.notes.trim(),
        picture,
      });

      Alert.alert(
        'Success',
        'Student updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating student:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Failed to update student');
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading student details...</Text>
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
          {/* Profile Picture */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploadingPicture || saving}
          >
            {picture ? (
              <Image source={{ uri: picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(formData.firstName?.[0] ?? '') + (formData.lastName?.[0] ?? '')}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingPicture ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.avatarEditIcon}>✎</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <TextInput
                label="First Name *"
                placeholder="John"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                editable={!saving}
              />
            </View>

            {/* Middle Name */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Middle Name"
                placeholder="Fred"
                value={formData.middleName}
                onChangeText={(text) => setFormData({ ...formData, middleName: text })}
                editable={!saving}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Last Name *"
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                editable={!saving}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={saving}
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

              <View style={styles.bottomSheetButtonContainer}>
                <Button
                  title="Done"
                  onPress={() => {
                    if (formData.dob) {
                      setShowDatePicker(false);
                    }
                  }}
                />
              </View>
            </BottomSheet>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderSheet(true)}
                disabled={saving}
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
              visible={showGenderSheet}
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

              <View style={styles.bottomSheetButtonContainer}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowGenderSheet(false)}
                />
              </View>
            </BottomSheet>

            {/* Allergies or Medical Conditions */}
            <View style={styles.inputGroup}>
              <TextInput
                label="Allergies or Medical Conditions"
                placeholder="Allergies, conditions, etc."
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
                editable={!saving}
              />
            </View>

            {/* Update Button */}
            <Button
              title="Update Student"
              onPress={handleUpdate}
              loading={saving}
              disabled={saving}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarEditIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  form: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
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
    padding: spacing.md,
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
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
  },
  bottomSheetOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  bottomSheetButtonContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
});
