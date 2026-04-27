import React, { useCallback, useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, View, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";


// Keep the native splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync();

const messagingInstance = getMessaging();

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
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen";
import NotificationDetailScreen from "./screens/NotificationDetailScreen";
import DeleteAccountScreen from "./screens/DeleteAccountScreen";
import ForceUpdateModal from "./components/common/ForceUpdateModal";

// Services
import authService from "./services/authService";
import notificationService, { FCM_CHANNEL_ID } from "./services/notificationService";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [
    'swastikdance://',
    'com.swastikdance.app://',
    'https://app.swastikdance.com.au',
    'https://customer-swastikdance.appunder.dev',
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard:    'dashboard',
          Notification: 'notifications',
          Profile:      'profile',
        },
      },
      StudentDetail:        'student/:studentId',
      WebView: {
        path: 'view/:targetRoute',
        parse: { targetRoute: (v) => '/' + v },
      },
      EditProfile:          'edit-profile',
      ChangePassword:       'change-password',
      NotificationSettings: 'notification-settings',
      NotificationDetail:   'notification/:id',
    },
  },
};

const needsUpdate = (minVer, currentVer) => {
  if (!minVer || !currentVer) return false;
  const a = String(minVer).split('.').map(Number);
  const b = String(currentVer).split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
};

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrls, setStoreUrls] = useState({});
  const navigationRef = useRef(null);

  useEffect(() => {
    console.log("=== App.js MOUNTED ===");
    notificationService.initialize();
    initApp();

    // Show in-app banner for foreground FCM messages
    const unsubscribe = onMessage(messagingInstance, async remoteMessage => {
      console.log('🔔 ============================================');
      console.log('🔔 [FCM] FOREGROUND - Message received');
      console.log('🔔 [FCM] messageId:', remoteMessage.messageId);
      console.log('🔔 [FCM] notification payload:', JSON.stringify(remoteMessage.notification ?? null));
      console.log('🔔 [FCM] data payload:', JSON.stringify(remoteMessage.data ?? {}));
      console.log('🔔 ============================================');
      const title = remoteMessage.notification?.title ?? remoteMessage.data?.title ?? "Swastik Dance";
      const body  = remoteMessage.notification?.body  ?? remoteMessage.data?.body  ?? "";

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: remoteMessage.data ?? {},
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: FCM_CHANNEL_ID }),
          },
          trigger: null,
        });
        console.log('🔔 [FCM] Foreground local notification scheduled (heads-up banner)');
      } catch (e) {
        console.warn('🔔 [FCM] Could not schedule local notification:', e.message ?? e);
      }
    });

    return () => {
      unsubscribe();
      notificationService.cleanup();
    };
  }, []);

  const initApp = async () => {
    try {
      console.log("App.js: Checking auth status...");
      const loggedIn = await authService.isLoggedIn();
      console.log("App.js: User logged in:", loggedIn);
      setIsLoggedIn(loggedIn);

      // Fetch and cache app config (feature flags + version requirements)
      const config = await authService.getFullAppConfig();
      await authService.cacheAppConfig(config);

      // Check if force update is required
      const minVersion = Platform.OS === 'ios'
        ? config?.min_version_ios
        : config?.min_version_android;
      const currentVersion =
        Constants.nativeAppVersion ??
        Constants.expoConfig?.version ??
        '0.0.0';
      console.log(`App.js: Version check — min: ${minVersion}, current: ${currentVersion}`);
      if (needsUpdate(minVersion, currentVersion)) {
        setStoreUrls({
          android: config?.store_url_android,
          ios: config?.store_url_ios,
        });
        setForceUpdate(true);
      }
    } catch (error) {
      console.error("App.js: Error checking auth status:", error);
    } finally {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  const handleNavigationReady = useCallback(() => {
    authService.setNavigationRef(navigationRef.current);
    notificationService.setNavigationRef(navigationRef.current);
    notificationService.handleInitialNotification();
  }, []);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ForceUpdateModal visible={forceUpdate} storeUrls={storeUrls} />

      <NavigationContainer ref={navigationRef} linking={linking} onReady={handleNavigationReady}>
        <Stack.Navigator
          initialRouteName={isLoggedIn ? "Main" : "Login"}
          screenOptions={{
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
            headerBackTitleVisible: false,
            headerBackTitle: ' ',
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Swastik Dance", headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Create Account" }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: "Reset Password" }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false, headerBackTitle: ' ' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Edit Profile" }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: "Change Password" }}
          />
          <Stack.Screen
            name="AddStudent"
            component={AddStudentScreen}
            options={{ title: "Add a new student" }}
          />
          <Stack.Screen
            name="StudentDetail"
            component={StudentDetailScreen}
            options={{ title: "Update Student" }}
          />
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            options={{ title: "Swastik Dance" }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ title: "Notification Settings" }}
          />
          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={{ title: "Notification" }}
          />
          <Stack.Screen
            name="DeleteAccount"
            component={DeleteAccountScreen}
            options={{ title: "Delete Account" }}
          />
        </Stack.Navigator>
      </NavigationContainer>

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
