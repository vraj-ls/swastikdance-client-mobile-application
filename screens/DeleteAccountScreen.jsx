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

  const toggleReason = (id) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const isOtherSelected = selectedReasons.includes('other');
  const canSubmit = selectedReasons.length > 0 && confirmed;

  const handleSubmit = () => {
    if (!canSubmit) return;
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
        <View style={styles.content}>

          {/* Warning notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Permanent action</Text>
            <Text style={styles.noticeText}>
              Once processed, your account and all associated data cannot be recovered.
            </Text>
          </View>

          {/* Reasons */}
          <View style={styles.field}>
            <Text style={styles.label}>Why are you leaving? *</Text>
            <Text style={styles.hint}>Select all that apply</Text>
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
          <TextInput
            label="Additional comments (optional)"
            placeholder="Any other feedback you'd like to share..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
          />

          {/* Confirmation */}
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConfirmed((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                {confirmed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkLabel, styles.confirmText]}>
                I understand this is permanent and all my data will be deleted *
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            onPress={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
            style={styles.button}
          >
            Submit Request
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
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 50,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  notice: {
    backgroundColor: 'rgba(229, 90, 40, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.sizes.xs,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  confirmText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  otherInput: {
    marginLeft: 22 + spacing.md,
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  note: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
