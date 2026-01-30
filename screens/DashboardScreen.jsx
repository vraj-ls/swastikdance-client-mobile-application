import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { ChevronRight, Calendar } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import authService from "../services/authService";
import Config from "../config";
import { Button } from "../components/common";
import { BottomSheet } from "../components/layouts";
import { colors, spacing, typography, borderRadius } from "../constants/theme";

const API_URL = Config.API_URL;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [awaitingPayments, setAwaitingPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every minute (60000ms)
    const intervalId = setInterval(() => {
      fetchDashboardData(true); // Pass true to indicate background refresh
    }, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async (isBackgroundRefresh = false) => {
    try {
      // Only show loading spinner if it's not a background refresh or pull-to-refresh
      if (!isBackgroundRefresh && !refreshing) {
        setLoading(true);
      }

      console.log("📊 [DASHBOARD] Starting data fetch...");
      console.log("📊 [DASHBOARD] API_URL:", API_URL);

      const token = await authService.getToken();
      console.log(
        "📊 [DASHBOARD] Token retrieved:",
        token ? `YES (length: ${token.length})` : "NO",
      );

      if (token) {
        console.log(
          "📊 [DASHBOARD] Token preview:",
          token.substring(0, 30) + "..." + token.substring(token.length - 30),
        );

        // Check token expiration
        const isExpired = authService.isTokenExpired(token);
        console.log("📊 [DASHBOARD] Token expired?", isExpired);

        if (isExpired) {
          console.warn("📊 [DASHBOARD] Token is expired!");
          const decoded = authService.getProfile(token);
          if (decoded?.exp) {
            const expDate = new Date(decoded.exp * 1000);
            console.log(
              "📊 [DASHBOARD] Token expired at:",
              expDate.toISOString(),
            );
            console.log(
              "📊 [DASHBOARD] Current time:",
              new Date().toISOString(),
            );
          }
        } else {
          const decoded = authService.getProfile(token);
          console.log("📊 [DASHBOARD] Token decoded:", {
            id: decoded?.id,
            email: decoded?.email,
            role: decoded?.role,
            exp: decoded?.exp,
            expDate: decoded?.exp
              ? new Date(decoded.exp * 1000).toISOString()
              : "N/A",
          });
        }
      }

      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      console.log("📊 [DASHBOARD] Request headers:", {
        Authorization: `Bearer ${token.substring(0, 30)}...`,
      });

      const paymentsUrl = `${API_URL}/awaiting-payments?limit=5`;
      const studentsUrl = `${API_URL}/students`;

      console.log("📊 [DASHBOARD] Payments URL:", paymentsUrl);
      console.log("📊 [DASHBOARD] Students URL:", studentsUrl);

      // Fetch awaiting payments and students in parallel
      const [paymentsResponse, studentsResponse] = await Promise.all([
        axios.get(paymentsUrl, { headers }),
        axios.get(studentsUrl, { headers }),
      ]);

      console.log(
        "📊 [DASHBOARD] Payments Response Status:",
        paymentsResponse.status,
      );
      console.log(
        "📊 [DASHBOARD] Payments Response Data:",
        JSON.stringify(paymentsResponse.data, null, 2),
      );
      console.log(
        "📊 [DASHBOARD] Students Response Status:",
        studentsResponse.status,
      );
      console.log(
        "📊 [DASHBOARD] Students Response Data:",
        JSON.stringify(studentsResponse.data, null, 2),
      );

      // Process awaiting payments
      if (paymentsResponse.data.success) {
        const formattedPayments =
          paymentsResponse.data.payload.transactions.map((transaction) => {
            // Format transaction title based on type
            const typeMap = {
              Enrolment: "Class Enrolment",
              Pass: "Class Pass",
              Order: "Products Order",
              Training: "Private Training",
              Performance: "Event Performance",
              Hire: "Hall Hire",
              Admission: "Workshop Admission",
            };

            const title = typeMap[transaction.type] || transaction.type;

            // Get entity name from populated entity object
            let entityName = "";
            const typeLower = transaction.type.toLowerCase();
            if (transaction[typeLower]) {
              entityName = transaction[typeLower].name || "";
            }

            const fullTitle = entityName ? `${title} - ${entityName}` : title;

            // Convert amount from cents to dollars
            const amount = `$${(transaction.amount / 100).toFixed(2)}`;

            // Format date - handle both timestamp (seconds) and Date object
            let date = "No due date";
            if (transaction.created) {
              if (typeof transaction.created === "number") {
                // If it's a timestamp in seconds, convert to milliseconds
                date = new Date(transaction.created * 1000).toLocaleDateString(
                  "en-AU",
                );
              } else if (
                transaction.created instanceof Date ||
                typeof transaction.created === "string"
              ) {
                // If it's already a Date object or ISO string
                date = new Date(transaction.created).toLocaleDateString(
                  "en-AU",
                );
              }
            }

            return {
              id: transaction.id,
              title: fullTitle,
              amount,
              date,
              rawTransaction: transaction,
            };
          });

        setAwaitingPayments(formattedPayments);
      } else {
        console.warn(
          "Payments API returned unsuccessful:",
          paymentsResponse.data,
        );
        setAwaitingPayments([]);
      }

      // Process students
      if (studentsResponse.data.success) {
        const formattedStudents = studentsResponse.data.payload.students.map(
          (student) => {
            return {
              id: student.id,
              name: student.name,
              age: student.age,
              gender: student.gender,
              picture: student.picture,
            };
          },
        );

        setStudents(formattedStudents);
      } else {
        console.warn(
          "Students API returned unsuccessful:",
          studentsResponse.data,
        );
        setStudents([]);
      }
    } catch (error) {
      console.error("📊 [DASHBOARD] Fetch Error:", error);
      console.error("📊 [DASHBOARD] Error details:", {
        message: error.message,
        code: error.code,
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              headers: error.response.headers,
            }
          : "No response",
        request: error.request
          ? {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
            }
          : "No request",
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });

      // Handle 401 Unauthorized (token expired)
      if (error.response?.status === 401) {
        console.log("Token expired, redirecting to login...");
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await authService.clearAuth();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              },
            },
          ],
          { cancelable: false },
        );
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load dashboard data";
      Alert.alert("Error", errorMessage);

      // Set empty arrays on error
      setAwaitingPayments([]);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      setStudentDetailsLoading(true);

      console.log(
        "🔍 [STUDENT DETAIL] Fetching student details for ID:",
        studentId,
      );
      console.log("🔍 [STUDENT DETAIL] API_URL:", API_URL);

      const token = await authService.getToken();
      console.log("🔍 [STUDENT DETAIL] Token retrieved:", token ? "YES" : "NO");

      if (!token) {
        Alert.alert("Error", "Please login again");
        setShowStudentModal(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const url = `${API_URL}/students/${studentId}`;
      console.log("🔍 [STUDENT DETAIL] Request URL:", url);

      const response = await axios.get(url, { headers });

      console.log("🔍 [STUDENT DETAIL] Response status:", response.status);
      console.log(
        "🔍 [STUDENT DETAIL] Response data:",
        JSON.stringify(response.data, null, 2),
      );

      if (
        response.data.success &&
        response.data.payload
      ) {
        console.log(
          "🔍 [STUDENT DETAIL] Student data found:",
          response.data.payload,
        );
        setSelectedStudent(response.data.payload);
      } else {
        console.error(
          "🔍 [STUDENT DETAIL] Invalid response structure:",
          response.data,
        );
        Alert.alert("Error", "Failed to load student details");
        setShowStudentModal(false);
      }
    } catch (error) {
      console.error(
        "🔍 [STUDENT DETAIL] Error fetching student details:",
        error,
      );
      console.error(
        "🔍 [STUDENT DETAIL] Error response:",
        error.response?.data,
      );
      console.error(
        "🔍 [STUDENT DETAIL] Error status:",
        error.response?.status,
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load student details",
      );
      setShowStudentModal(false);
    } finally {
      setStudentDetailsLoading(false);
    }
  };

  const handleViewStudent = async (studentId) => {
    console.log(
      "👆 [STUDENT DETAIL] View button clicked for student ID:",
      studentId,
    );
    setShowStudentModal(true);
    setSelectedStudent(null); // Reset previous student data
    await fetchStudentDetails(studentId);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.paymentTitle}>{item.title}</Text>
          <View style={styles.dateContainer}>
            <Calendar color={colors.textTertiary} size={14} />
            <Text style={styles.paymentDate}>Due: {item.date}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.paymentAmount}>{item.amount}</Text>
          <Button
            variant="outline"
            onPress={() => {}}
            style={styles.payButton}
            textStyle={styles.payButtonText}
          >
            Pay Now
          </Button>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => handleViewStudent(item.id)}
    >
      <View style={styles.studentAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>
          {item.gender} • {item.age} years
        </Text>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewStudent(item.id)}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Awaiting Payment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Awaiting Payment</Text>
          </View>
          {awaitingPayments.length > 0 ? (
            <FlatList
              data={awaitingPayments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending payments</Text>
            </View>
          )}
        </View>

        {/* Student Listing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students</Text>
          </View>
          {students.length > 0 ? (
            <FlatList
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          )}
          <Button
            variant="secondary"
            onPress={() => navigation.navigate("AddStudent")}
            style={styles.addStudentButton}
          >
            Add Student
          </Button>
        </View>
      </ScrollView>

      {/* Student Detail Bottom Sheet */}
      <BottomSheet
        visible={showStudentModal}
        onClose={closeStudentModal}
        title="Student Details"
      >
        {studentDetailsLoading ? (
          <View style={styles.bottomSheetLoading}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>
              Loading student details...
            </Text>
          </View>
        ) : !selectedStudent ? (
          <View style={styles.bottomSheetLoading}>
            <Text style={styles.emptyText}>
              No student data available
            </Text>
          </View>
        ) : (
          <View style={styles.studentDetailsContainer}>
            {/* Student Name */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>
                {selectedStudent.firstName}{" "}
                {selectedStudent.middleName
                  ? selectedStudent.middleName + " "
                  : ""}
                {selectedStudent.lastName}
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>
                {selectedStudent.dobISO || selectedStudent.dob
                  ? selectedStudent.dobISO
                    ? new Date(selectedStudent.dobISO).toLocaleDateString(
                        "en-AU",
                      )
                    : new Date(
                        selectedStudent.dob * 1000,
                      ).toLocaleDateString("en-AU")
                  : "Not provided"}
              </Text>
            </View>

            {/* Gender */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>
                {selectedStudent.gender}
              </Text>
            </View>

            {/* Medical Notes */}
            {selectedStudent.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medical Notes</Text>
                <Text style={styles.detailValue}>
                  {selectedStudent.notes}
                </Text>
              </View>
            )}

            {/* Edit Button */}
            <Button
              variant="secondary"
              onPress={() => {
                closeStudentModal();
                navigation.navigate("StudentDetail", {
                  studentId: selectedStudent.id,
                });
              }}
              style={styles.editStudentButton}
            >
              Edit Student
            </Button>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  // Payment Card Styles
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  paymentTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm - 2,
  },
  paymentDate: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  paymentAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  payButton: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  payButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  // Student Card Styles
  studentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: borderRadius.lg,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  studentDetails: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  viewButton: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm + 2,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  viewButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  // Empty State
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  addStudentButton: {
    marginTop: spacing.md,
  },
  // Bottom Sheet Styles
  bottomSheetLoading: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  studentDetailsContainer: {
    paddingBottom: spacing.lg,
  },
  detailRow: {
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm - 2,
    fontWeight: typography.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  editStudentButton: {
    marginTop: spacing.lg,
  },
});
