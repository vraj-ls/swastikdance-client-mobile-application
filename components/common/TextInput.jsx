import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

export const TextInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  editable = true,
  multiline = false,
  numberOfLines,
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
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
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

TextInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  editable: PropTypes.bool,
  multiline: PropTypes.bool,
  numberOfLines: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  inputStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  labelStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  rightElement: PropTypes.node,
};
