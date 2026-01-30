import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import authService from "../services/authService";
import { Button } from "../components/common/Button";
import { TextInput } from "../components/common/TextInput";
import { colors, spacing, typography, borderRadius } from "../constants/theme";

export default function ChangePasswordScreen({ navigation }) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Check if passwords are provided
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    }

    // Check if passwords match
    if (formData.newPassword && formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(
        formData.newPassword,
        formData.confirmPassword,
      );
      Alert.alert("Success", "Password changed successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your new password must be at least 8 characters long.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="New Password *"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, newPassword: text });
                setErrors({ ...errors, newPassword: null });
              }}
              secureTextEntry={!showNewPassword}
              editable={!loading}
              error={errors.newPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <TextInput
              label="Confirm New Password *"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                setErrors({ ...errors, confirmPassword: null });
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
              error={errors.confirmPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
              variant="secondary"
              style={styles.button}
            >
              Change Password
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: "#1e40af",
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
    fontStyle: "italic",
  },
});
