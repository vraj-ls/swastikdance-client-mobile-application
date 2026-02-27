import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

export const FCM_CHANNEL_ID = 'swastik-default';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create the Android notification channel (must run before any notification is shown)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync(FCM_CHANNEL_ID, {
    name: 'Swastik Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E55A28',
  });
}

class NotificationService {
  constructor() {
    this.navigationRef = null;
    this.foregroundFCMListener = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  /**
   * Set the navigation reference for deep linking
   */
  setNavigationRef(ref) {
    this.navigationRef = ref;
    console.log('🔔 [NOTIFICATIONS] Navigation ref set');
  }

  /**
   * Initialize notification listeners
   * Call this in App.js on mount
   */
  initialize() {
    if (this.isInitialized) {
      console.log('🔔 [NOTIFICATIONS] Already initialized');
      return;
    }

    console.log('🔔 [NOTIFICATIONS] Initializing...');
    this.setupNotificationListeners();
    this.isInitialized = true;
  }

  /**
   * Request permissions and get FCM token for login
   * Returns token to be sent with login request
   * Call this BEFORE login
   */
  async getTokenForLogin() {
    try {
      console.log('🔔 [NOTIFICATIONS] Getting token for login...');

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🔔 [NOTIFICATIONS] Permission denied');
        return null;
      }

      console.log('🔔 [NOTIFICATIONS] Permission granted');

      // Request Firebase messaging permission (required for iOS; no-op on Android)
      await messaging().requestPermission();

      const token = await this.getFCMToken();
      if (!token) {
        console.log('🔔 [NOTIFICATIONS] Failed to get token');
        return null;
      }

      return token;
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error getting token for login:', error);
      return null;
    }
  }

  /**
   * Get FCM registration token directly from Firebase (no Expo push service)
   */
  async getFCMToken() {
    try {
      // Get real FCM registration token — works with firebase-admin directly
      const token = await messaging().getToken();

      console.log('🔔 [NOTIFICATIONS] Token obtained:', token);

      // Print FCM token prominently for testing
      console.log('\n========================================');
      console.log('📱 FCM TOKEN:');
      console.log(token);
      console.log('========================================\n');

      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);

      return token;
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error getting token:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners for foreground and tap handling
   */
  setupNotificationListeners() {
    // Handle FCM messages received while app is in foreground — show as local notification
    this.foregroundFCMListener = messaging().onMessage(async remoteMessage => {
      console.log('🔔 [NOTIFICATIONS] FCM foreground message:', remoteMessage);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? 'Swastik Dance',
          body: remoteMessage.notification?.body ?? '',
          data: remoteMessage.data ?? {},
          sound: 'default',
        },
        trigger: null, // show immediately
      });
    });

    // Listener for local notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [NOTIFICATIONS] Received in foreground:', notification);
    });

    // Listener for notification tap (user interaction)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 [NOTIFICATIONS] User tapped notification:', response);
      this.handleNotificationTap(response.notification);
    });

    console.log('🔔 [NOTIFICATIONS] Listeners registered');
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  handleNotificationTap(notification) {
    if (!this.navigationRef) {
      console.log('🔔 [NOTIFICATIONS] Navigation ref not available');
      return;
    }

    const notificationData = notification.request.content.data;
    const type = notificationData?.type;

    console.log('🔔 [NOTIFICATIONS] Handling tap, type:', type);

    switch (type) {
      case 'STUDENT_WELCOME':
        // Navigate to student detail if studentId is provided
        if (notificationData.studentId) {
          this.navigationRef.navigate('StudentDetail', {
            studentId: notificationData.studentId,
          });
        }
        break;

      case 'SESSION_REMINDER':
        // Navigate to dashboard
        this.navigationRef.navigate('Dashboard');
        break;

      case 'GENERAL':
      default:
        // Navigate to notifications screen
        this.navigationRef.navigate('Notifications');
        break;
    }
  }

  /**
   * Clear FCM token on logout
   */
  async clearToken() {
    try {
      console.log('🔔 [NOTIFICATIONS] Clearing token...');

      const authToken = await AsyncStorage.getItem('auth_token');

      // Remove token from backend
      await axios.delete(`${API_URL}/mobile/fcm-token`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Remove token from local storage
      await AsyncStorage.removeItem('fcm_token');

      console.log('🔔 [NOTIFICATIONS] Token cleared');
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error clearing token:', error);
      // Don't throw - logout should continue even if token clearing fails
    }
  }

  /**
   * Set badge count (number on app icon)
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error clearing badge:', error);
    }
  }

  /**
   * Cleanup listeners on app unmount
   */
  cleanup() {
    console.log('🔔 [NOTIFICATIONS] Cleaning up listeners...');

    try {
      if (this.foregroundFCMListener) {
        this.foregroundFCMListener();
        this.foregroundFCMListener = null;
      }

      if (this.notificationListener) {
        this.notificationListener.remove();
        this.notificationListener = null;
      }

      if (this.responseListener) {
        this.responseListener.remove();
        this.responseListener = null;
      }

      this.isInitialized = false;
      console.log('🔔 [NOTIFICATIONS] Cleanup complete');
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error during cleanup:', error);
      // Still mark as cleaned up even if error occurs
      this.notificationListener = null;
      this.responseListener = null;
      this.isInitialized = false;
    }
  }
}

export default new NotificationService();
