import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from '../components/common/TextInput';
import { Button } from '../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const REASONS = [
  { id: 'no_longer_dancing', label: "I'm no longer dancing" },
  { id: 'another_studio', label: 'Moving to another dance studio' },
  { id: 'financial', label: 'Financial reasons' },
  { id: 'too_busy', label: 'Too busy / lifestyle change' },
  { id: 'privacy', label: 'Privacy concerns' },
  { id: 'other', label: 'Other' },
];

export default function DeleteAccountScreen({ navigation }) {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [comments, setComments] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleReason = (id) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const isOtherSelected = selectedReasons.includes('other');
  const canSubmit = selectedReasons.length > 0 && confirmed && !submitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    Alert.alert(
      'Request Submitted',
      'Your request has been sent successfully. Please wait while we get back to you.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Warning banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️  This action is permanent</Text>
          <Text style={styles.warningText}>
            Submitting this form will send a deletion request to our team. Once
            processed, your account and all associated data cannot be recovered.
          </Text>
        </View>

        {/* Reasons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why are you leaving? *</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          {REASONS.map((reason) => {
            const checked = selectedReasons.includes(reason.id);
            return (
              <TouchableOpacity
                key={reason.id}
                style={styles.checkRow}
                onPress={() => toggleReason(reason.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>{reason.label}</Text>
              </TouchableOpacity>
            );
          })}

          {isOtherSelected && (
            <TextInput
              placeholder="Please specify..."
              value={otherText}
              onChangeText={setOtherText}
              style={styles.otherInput}
            />
          )}
        </View>

        {/* Additional comments */}
        <View style={styles.section}>
          <TextInput
            label="Additional comments (optional)"
            placeholder="Any other feedback you'd like to share..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Confirmation checkbox */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setConfirmed((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
              {confirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkLabel, styles.confirmLabel]}>
              I understand this is a permanent action and all my data will be deleted *
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <View style={styles.section}>
          <Button
            onPress={handleSubmit}
            disabled={!canSubmit}
            variant="secondary"
            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          >
            Submit Deletion Request
          </Button>
          <Text style={styles.note}>* Required</Text>
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  warningBox: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#92400e',
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: '#92400e',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    lineHeight: 16,
  },
  checkLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  confirmLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  otherInput: {
    marginTop: spacing.xs,
    marginLeft: 22 + spacing.md,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  note: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
