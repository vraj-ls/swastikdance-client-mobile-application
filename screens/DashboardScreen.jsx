import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import PropTypes from "prop-types";
import { Calendar } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import authService from "../services/authService";
import { Button } from "../components/common";
import { BottomSheet } from "../components/layouts";
import { formatDate, formatCurrency } from "../utils";
import { API_URL } from "../constants/config";
import { colors, spacing, typography, borderRadius } from "../constants/theme";

// Transaction type mapping
const TRANSACTION_TYPE_MAP = {
  Enrolment: "Class Enrolment",
  Pass: "Class Pass",
  Order: "Products Order",
  Admission: "Workshop Admission",
};

// Payment Item Component (memoized)
const PaymentItem = React.memo(({ item, onPress }) => (
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
          onPress={() => onPress(item.id)}
          style={styles.payButton}
          textStyle={styles.payButtonText}
        >
          Pay Now
        </Button>
      </View>
    </View>
  </TouchableOpacity>
));

PaymentItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    amount: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

// Student Item Component (memoized)
const StudentItem = React.memo(({ item, onViewStudent }) => (
  <TouchableOpacity
    style={styles.studentCard}
    onPress={() => onViewStudent(item.id)}
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
      onPress={() => onViewStudent(item.id)}
    >
      <Text style={styles.viewButtonText}>View</Text>
    </TouchableOpacity>
  </TouchableOpacity>
));

StudentItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    gender: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
  }).isRequired,
  onViewStudent: PropTypes.func.isRequired,
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [awaitingPayments, setAwaitingPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  // Format transaction helper
  const formatTransaction = useCallback((transaction) => {
    const title = TRANSACTION_TYPE_MAP[transaction.type] || transaction.type;

    // Get entity name from populated entity object
    let entityName = "";
    const typeLower = transaction.type.toLowerCase();
    if (transaction[typeLower]) {
      entityName = transaction[typeLower].name || "";
    }

    const fullTitle = entityName ? `${title} - ${entityName}` : title;
    const amount = formatCurrency(transaction.amount);
    const date = formatDate(transaction.created);

    return {
      id: transaction.id,
      title: fullTitle,
      amount,
      date: date || "No due date",
      rawTransaction: transaction,
    };
  }, []);

  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh && !refreshing) {
        setLoading(true);
      }

      const token = await authService.getToken();
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      // Check token expiration
      if (authService.isTokenExpired(token)) {
        console.warn("Token is expired!");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [paymentsResponse, studentsResponse] = await Promise.all([
        axios.get(`${API_URL}/awaiting-payments?limit=5`, { headers }),
        axios.get(`${API_URL}/students`, { headers }),
      ]);

      // Process payments
      if (paymentsResponse.data.success) {
        const formattedPayments = paymentsResponse.data.payload.transactions.map(
          formatTransaction
        );
        setAwaitingPayments(formattedPayments);
      } else {
        setAwaitingPayments([]);
      }

      // Process students
      if (studentsResponse.data.success) {
        const formattedStudents = studentsResponse.data.payload.students.map(
          (student) => ({
            id: student.id,
            name: student.name,
            age: student.age,
            gender: student.gender,
            picture: student.picture,
          })
        );
        setStudents(formattedStudents);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
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
          { cancelable: false }
        );
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load dashboard data";
      Alert.alert("Error", errorMessage);

      setAwaitingPayments([]);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, navigation, formatTransaction]);

  const fetchStudentDetails = useCallback(async (studentId) => {
    try {
      setStudentDetailsLoading(true);

      const token = await authService.getToken();
      if (!token) {
        Alert.alert("Error", "Please login again");
        setShowStudentModal(false);
        return;
      }

      const response = await axios.get(`${API_URL}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.payload) {
        setSelectedStudent(response.data.payload);
      } else {
        Alert.alert("Error", "Failed to load student details");
        setShowStudentModal(false);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load student details"
      );
      setShowStudentModal(false);
    } finally {
      setStudentDetailsLoading(false);
    }
  }, []);

  const handleViewStudent = useCallback(
    async (studentId) => {
      setShowStudentModal(true);
      setSelectedStudent(null);
      await fetchStudentDetails(studentId);
    },
    [fetchStudentDetails]
  );

  const closeStudentModal = useCallback(() => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  }, []);

  const handlePaymentPress = useCallback(
    (transactionId) => {
      navigation.navigate("WebView", {
        targetRoute: `/transactions/${transactionId}`,
      });
    },
    [navigation]
  );

  const handleViewAllTransactions = useCallback(() => {
    navigation.navigate("WebView", { targetRoute: "/transactions" });
  }, [navigation]);

  const handleAddStudent = useCallback(() => {
    navigation.navigate("AddStudent");
  }, [navigation]);

  const handleEditStudent = useCallback(
    (studentId) => {
      closeStudentModal();
      navigation.navigate("StudentDetail", { studentId });
    },
    [closeStudentModal, navigation]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // Memoized render functions
  const renderPaymentItem = useCallback(
    ({ item }) => <PaymentItem item={item} onPress={handlePaymentPress} />,
    [handlePaymentPress]
  );

  const renderStudentItem = useCallback(
    ({ item }) => <StudentItem item={item} onViewStudent={handleViewStudent} />,
    [handleViewStudent]
  );

  const keyExtractorPayment = useCallback((item) => item.id, []);
  const keyExtractorStudent = useCallback((item) => item.id, []);

  // Memoized student full name
  const studentFullName = useMemo(() => {
    if (!selectedStudent) return "";
    const parts = [
      selectedStudent.firstName,
      selectedStudent.middleName,
      selectedStudent.lastName,
    ].filter(Boolean);
    return parts.join(" ");
  }, [selectedStudent]);

  // Memoized student DOB
  const studentDOB = useMemo(() => {
    if (!selectedStudent) return "Not provided";
    if (selectedStudent.dobISO) {
      return new Date(selectedStudent.dobISO).toLocaleDateString("en-AU");
    }
    if (selectedStudent.dob) {
      return new Date(selectedStudent.dob * 1000).toLocaleDateString("en-AU");
    }
    return "Not provided";
  }, [selectedStudent]);

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
        contentContainerStyle={styles.scrollContent}
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
              keyExtractor={keyExtractorPayment}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending payments</Text>
            </View>
          )}
          <Button
            variant="outline"
            onPress={handleViewAllTransactions}
            style={styles.viewTransactionsButton}
          >
            View All Transactions
          </Button>
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
              keyExtractor={keyExtractorStudent}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          )}
          <Button
            variant="secondary"
            onPress={handleAddStudent}
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
            <Text style={styles.loadingText}>Loading student details...</Text>
          </View>
        ) : !selectedStudent ? (
          <View style={styles.bottomSheetLoading}>
            <Text style={styles.emptyText}>No student data available</Text>
          </View>
        ) : (
          <View style={styles.studentDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{studentFullName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{studentDOB}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{selectedStudent.gender}</Text>
            </View>

            {selectedStudent.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medical Notes</Text>
                <Text style={styles.detailValue}>{selectedStudent.notes}</Text>
              </View>
            )}

            <Button
              variant="secondary"
              onPress={() => handleEditStudent(selectedStudent.id)}
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
  scrollContent: {
    paddingBottom: 160,
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
  viewTransactionsButton: {
    marginTop: spacing.md,
  },
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
