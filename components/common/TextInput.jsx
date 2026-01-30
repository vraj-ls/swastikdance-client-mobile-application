import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

export const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
  multiline = false,
  style,
  inputStyle,
  labelStyle,
  rightElement,
  ...props
}) => {
  return (
    <View style={[styles.inputGroup, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={[
            styles.input,
            error && styles.inputError,
            !editable && styles.inputDisabled,
            multiline && styles.inputMultiline,
            rightElement && styles.inputWithRightElement,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          editable={editable}
          multiline={multiline}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputWithRightElement: {
    paddingRight: 48,
  },
  rightElement: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: colors.textSecondary,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
