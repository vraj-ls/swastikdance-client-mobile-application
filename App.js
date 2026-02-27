import React, { useCallback, useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import InAppNotification from "./components/common/InAppNotification";
import { FCM_CHANNEL_ID } from "./services/notificationService";

// Register background/killed-state FCM handler (must be at module scope, before React tree)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[FCM] Background message received:", remoteMessage);
  // For data-only messages (no notification payload), the OS won't show anything
  // automatically, so we schedule a local notification manually.
  if (!remoteMessage.notification) {
    // Ensure the Android channel exists in the headless task context
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(FCM_CHANNEL_ID, {
        name: "Swastik Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E55A28",
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.data?.title ?? "Swastik Dance",
        body: remoteMessage.data?.body ?? "",
        data: remoteMessage.data ?? {},
        sound: "default",
        // channelId routes the notification to the correct Android channel
        ...(Platform.OS === "android" && { channelId: FCM_CHANNEL_ID }),
      },
      trigger: null,
    });
  }
});

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import AddStudentScreen from "./screens/AddStudentScreen";
import StudentDetailScreen from "./screens/StudentDetailScreen";
import WebViewScreen from "./screens/WebViewScreen";
import MainTabNavigator from "./screens/MainTabNavigator";

// Services
import authService from "./services/authService";
import notificationService from "./services/notificationService";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [foregroundNotification, setForegroundNotification] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    console.log("=== App.js MOUNTED ===");
    notificationService.initialize();
    checkAuthStatus();

    // Show in-app banner for foreground FCM messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      setForegroundNotification({
        title: remoteMessage.notification?.title ?? remoteMessage.data?.title ?? "Swastik Dance",
        body: remoteMessage.notification?.body ?? remoteMessage.data?.body ?? "",
        data: remoteMessage.data ?? {},
      });
    });

    return () => {
      unsubscribe();
      notificationService.cleanup();
    };
  }, []);

  // Called by NavigationContainer once the navigator is fully mounted and ready.
  // This is the correct place to set the navigation ref and handle the initial
  // notification (app opened from killed state by tapping a notification).
  const handleNavigationReady = useCallback(() => {
    authService.setNavigationRef(navigationRef.current);
    notificationService.setNavigationRef(navigationRef.current);
    notificationService.handleInitialNotification();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log("App.js: Checking auth status...");
      const loggedIn = await authService.isLoggedIn();
      console.log("App.js: User logged in:", loggedIn);
      setIsLoggedIn(loggedIn);
    } catch (error) {
      console.error("App.js: Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E55A28" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>

        <Stack.Navigator
          initialRouteName={isLoggedIn ? "Main" : "Login"}
          screenOptions={{
            headerStyle: {
              backgroundColor: "#000000",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          {/* All screens available for navigation */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: "Swastik Dance",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: "Create Account",
            }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{
              title: "Reset Password",
            }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              title: "Edit Profile",
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              title: "Change Password",
            }}
          />
          <Stack.Screen
            name="AddStudent"
            component={AddStudentScreen}
            options={{
              title: "Add a new student",
            }}
          />
          <Stack.Screen
            name="StudentDetail"
            component={StudentDetailScreen}
            options={{
              title: "Update Student",
            }}
          />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            options={{
              title: "Swastik Dance", // Default title, will be updated dynamically
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <InAppNotification
        notification={foregroundNotification}
        onDismiss={() => setForegroundNotification(null)}
        onTap={(notification) => {
          setForegroundNotification(null);
          notificationService.handleNotificationTap({ request: { content: { data: notification.data } } });
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E55C2A",
  },
});
