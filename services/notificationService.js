import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';

const API_URL = Config.API_URL;

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.navigationRef = null;
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

      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('🔔 [NOTIFICATIONS] Simulator detected, skipping token generation');
        return null;
      }

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

      // Get Expo Push Token
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
   * Get FCM token from Expo
   */
  async getFCMToken() {
    try {
      // Get Expo Push Token (works with Firebase FCM)
      const tokenData = await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
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
    // Listener for notifications received while app is in foreground
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

    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    this.isInitialized = false;
    console.log('🔔 [NOTIFICATIONS] Cleanup complete');
  }
}

export default new NotificationService();
