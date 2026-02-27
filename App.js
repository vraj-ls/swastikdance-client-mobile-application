import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import messaging from "@react-native-firebase/messaging";

// Register background/killed-state FCM handler (must be at module scope, before React tree)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[FCM] Background message received:", remoteMessage);
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
  const navigationRef = useRef(null);

  useEffect(() => {
    console.log("=== App.js MOUNTED ===");
    // Set navigation ref in auth service for logout navigation
    if (navigationRef.current) {
      authService.setNavigationRef(navigationRef.current);
      notificationService.setNavigationRef(navigationRef.current);
    }

    notificationService.initialize();
    checkAuthStatus();

    return () => {
      notificationService.cleanup();
    };
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
    <>
      <StatusBar style="light" />
      <NavigationContainer ref={navigationRef}>
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
    </>
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
