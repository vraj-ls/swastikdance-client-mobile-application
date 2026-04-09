import React, { useState, useEffect } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import authService from "../services/authService";
import notificationService from "../services/notificationService";
import { Button } from "../components/common/Button";
import { TextInput } from "../components/common/TextInput";
import { BottomSheet } from "../components/layouts/BottomSheet";
import { colors, spacing, typography, borderRadius } from "../constants/theme";

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    street: "",
    suburb: "",
    postcode: "",
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const parseDobToDate = (dobStr) => {
    if (!dobStr) return null;
    const [y, m, d] = dobStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // Initialize date picker value from formData.dob when opening
  useEffect(() => {
    if (showDatePicker) {
      const date = parseDobToDate(formData.dob) || new Date();
      setSelectedDate(date);
    }
  }, [showDatePicker, formData.dob]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (_event, date) => {
    if (date) {
      setSelectedDate(date);
      // Format date in local timezone to avoid timezone offset issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      handleChange("dob", formattedDate);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleGenderSelect = (gender) => {
    handleChange("gender", gender);
    setShowGenderSheet(false);
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, dob, gender } = formData;

    if (!firstName || !lastName || !email || !phone || !dob || !gender) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      console.log("=== REGISTRATION REQUEST ===");
      console.log(
        "Form Data:",
        JSON.stringify({ ...formData, email: email.toLowerCase() }, null, 2),
      );

      const response = await authService.register({
        ...formData,
        email: email.toLowerCase(),
      });

      console.log("=== REGISTRATION RESPONSE ===");
      console.log("Full Response:", JSON.stringify(response, null, 2));

      // Show password to user
      // Register FCM token now that auth is stored
      notificationService.checkAndRegisterToken().catch(() => {});

      if (response.payload.password) {
        console.log("Registration successful, showing password to user");
        Alert.alert(
          "Registration Successful",
          `Your account has been created!\n\nYour password has been sent to your email: ${response.payload.password}\n\nPlease save this password.`,
          [
            {
              text: "OK",
              onPress: () => {
                console.log("Navigating to Main after registration...");
                navigation.replace("Main");
              },
            },
          ],
        );
      } else {
        console.log("Navigating to Main after registration...");
        navigation.replace("Main");
      }
    } catch (error) {
      console.error("=== REGISTRATION ERROR ===");
      console.error("Error:", error);
      Alert.alert("Registration Failed", error || "Unable to create account");
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
          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="First Name *"
              placeholder="John"
              value={formData.firstName}
              onChangeText={(value) => handleChange("firstName", value)}
              editable={!loading}
            />

            <TextInput
              label="Last Name *"
              placeholder="Doe"
              value={formData.lastName}
              onChangeText={(value) => handleChange("lastName", value)}
              editable={!loading}
            />

            <TextInput
              label="Email *"
              placeholder="john.doe@email.com"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              label="Phone *"
              placeholder="+61412345678"
              value={formData.phone}
              onChangeText={(value) => handleChange("phone", value)}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <View style={styles.dropdownContent}>
                  <Text
                    style={[
                      styles.dateText,
                      !formData.dob && styles.placeholderText,
                    ]}
                  >
                    {formData.dob
                      ? formatDateDisplay(formData.dob)
                      : "Select date"}
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
                  value={parseDobToDate(formData.dob) || selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "spinner"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor={colors.textPrimary}
                />
              </View>

              <TouchableOpacity
                style={styles.bottomSheetDoneButton}
                onPress={() => {
                  if (formData.dob) {
                    setShowDatePicker(false);
                  }
                }}
              >
                <Text style={styles.bottomSheetDoneText}>Done</Text>
              </TouchableOpacity>
            </BottomSheet>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowGenderSheet(true)}
                disabled={loading}
              >
                <View style={styles.dropdownContent}>
                  <Text
                    style={[
                      styles.dateText,
                      !formData.gender && styles.placeholderText,
                    ]}
                  >
                    {formData.gender === "MALE"
                      ? "Male"
                      : formData.gender === "FEMALE"
                        ? "Female"
                        : "Select gender"}
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
                onPress={() => handleGenderSelect("MALE")}
              >
                <Text style={styles.bottomSheetOptionText}>Male</Text>
                {formData.gender === "MALE" && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <View style={styles.bottomSheetDivider} />

              <TouchableOpacity
                style={styles.bottomSheetOption}
                onPress={() => handleGenderSelect("FEMALE")}
              >
                <Text style={styles.bottomSheetOptionText}>Female</Text>
                {formData.gender === "FEMALE" && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomSheetCancelButton}
                onPress={() => setShowGenderSheet(false)}
              >
                <Text style={styles.bottomSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </BottomSheet>

            <TextInput
              label="Street"
              placeholder="123 Main St"
              value={formData.street}
              onChangeText={(value) => handleChange("street", value)}
              editable={!loading}
            />

            <TextInput
              label="Suburb"
              placeholder="Sydney"
              value={formData.suburb}
              onChangeText={(value) => handleChange("suburb", value)}
              editable={!loading}
            />

            <TextInput
              label="Postcode"
              placeholder="2000"
              value={formData.postcode}
              onChangeText={(value) => handleChange("postcode", value)}
              keyboardType="numeric"
              editable={!loading}
            />

            <Button
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
            >
              Register
            </Button>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
    maxWidth: 500,
    width: "100%",
    alignSelf: Platform.select({ web: "flex-start", default: "center" }),
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
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
    marginBottom: spacing.xs,
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
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownIcon: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  bottomSheetOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
  },
  bottomSheetOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: spacing.lg,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  bottomSheetCancelButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  bottomSheetCancelText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  bottomSheetDoneButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  bottomSheetDoneText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  registerButton: {
    marginTop: spacing.md,
  },
});
