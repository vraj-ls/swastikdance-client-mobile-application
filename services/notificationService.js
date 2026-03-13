import * as Notifications from 'expo-notifications';
import {
  getMessaging,
  registerDeviceForRemoteMessages,
  getToken,
  requestPermission,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../constants/config';

export const FCM_CHANNEL_ID = 'swastik-default';

const messagingInstance = getMessaging();

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
    this.notificationListener = null;
    this.responseListener = null;
    this.backgroundOpenListener = null;
    this.tokenRefreshListener = null;
    this.isInitialized = false;
  }

  /**
   * Set the navigation reference for deep linking.
   * Call this from NavigationContainer's onReady callback.
   */
  setNavigationRef(ref) {
    this.navigationRef = ref;
    console.log('🔔 [NOTIFICATIONS] Navigation ref set');
  }

  /**
   * Initialize notification listeners.
   * Call this in App.js on mount.
   */
  initialize() {
    if (this.isInitialized) {
      console.log('🔔 [NOTIFICATIONS] Already initialized');
      return;
    }

    console.log('🔔 [NOTIFICATIONS] Initializing...');
    this.setupNotificationListeners();
    // Fire-and-forget: re-register token if the user is already logged in.
    // This handles the case where a user was logged in before push notifications
    // were added, or whose FCM token has rotated since their last login.
    this.checkAndRegisterToken();
    this.isInitialized = true;
  }

  /**
   * Check if the current FCM token differs from what the backend has, and
   * re-register it if so. Safe to call any time; no-ops if not logged in or
   * if permission hasn't been granted yet.
   */
  async checkAndRegisterToken() {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return; // Not logged in

      // Don't try to get the token if the user hasn't granted permission yet
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      // On iOS, ensure APNs registration is active before asking for the FCM token
      await registerDeviceForRemoteMessages(messagingInstance);

      const currentToken = await getToken(messagingInstance);
      if (!currentToken) return;

      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
      if (currentToken === storedToken) {
        console.log('🔔 [NOTIFICATIONS] Token unchanged, no re-registration needed');
        return;
      }

      // Token is new or has rotated — update local storage and backend
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, currentToken);
      await axios.put(`${API_URL}/fcm-token`, { token: currentToken }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('🔔 [NOTIFICATIONS] Token registered on startup (was stale or missing)');
    } catch (error) {
      // Non-fatal — the user can still use the app, they just won't get push
      // notifications until they log out and back in or the token refreshes.
      console.warn('🔔 [NOTIFICATIONS] Startup token registration failed:', error.message ?? error);
    }
  }

  /**
   * Request permissions and get FCM token for login.
   * Returns token to be sent with login request.
   * Call this BEFORE login.
   */
  async getTokenForLogin() {
    try {
      console.log('🔔 [NOTIFICATIONS] Getting token for login...');

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🔔 [NOTIFICATIONS] Permission denied');
        return null;
      }

      console.log('🔔 [NOTIFICATIONS] Permission granted');

      // Request Firebase messaging permission (required for iOS; no-op on Android)
      await requestPermission(messagingInstance);

      // Register with APNs before requesting the FCM token (required on iOS in RNFB v7+)
      await registerDeviceForRemoteMessages(messagingInstance);

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
      const token = await getToken(messagingInstance);

      console.log('\n========================================');
      console.log('📱 FCM TOKEN:');
      console.log(token);
      console.log('========================================\n');

      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
      return token;
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error getting token:', error);
      return null;
    }
  }

  /**
   * Setup all notification listeners.
   */
  setupNotificationListeners() {
    // Local notification received while app is in foreground (from scheduleNotificationAsync)
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 [NOTIFICATIONS] Local notification received in foreground:', notification);
    });

    // User taps a LOCAL notification (data-only FCM messages scheduled as local notifications)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 [NOTIFICATIONS] User tapped local notification:', response);
      this.handleNotificationTap(response.notification);
    });

    // User taps a FCM notification while app is in BACKGROUND (not killed)
    this.backgroundOpenListener = onNotificationOpenedApp(messagingInstance, remoteMessage => {
      console.log('🔔 ============================================');
      console.log('🔔 [FCM] BACKGROUND TAP - User tapped notification');
      console.log('🔔 [FCM] messageId:', remoteMessage.messageId);
      console.log('🔔 [FCM] notification:', JSON.stringify(remoteMessage.notification ?? null));
      console.log('🔔 [FCM] data:', JSON.stringify(remoteMessage.data ?? {}));
      console.log('🔔 ============================================');
      this.navigateFromData(remoteMessage.data ?? {});
    });

    // FCM token refresh — update backend with new token
    this.tokenRefreshListener = onTokenRefresh(messagingInstance, async (newToken) => {
      console.log('🔔 [NOTIFICATIONS] FCM token refreshed');
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);
      try {
        const authToken = await AsyncStorage.getItem('auth_token');
        if (authToken) {
          await axios.put(`${API_URL}/fcm-token`, { token: newToken }, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          console.log('🔔 [NOTIFICATIONS] Refreshed token sent to backend');
        }
      } catch (e) {
        console.warn('🔔 [NOTIFICATIONS] Failed to update refreshed token on server:', e);
      }
    });

    console.log('🔔 [NOTIFICATIONS] Listeners registered');
  }

  /**
   * Handle app opened from a KILLED state via notification tap.
   * Must be called after NavigationContainer is ready (onReady callback).
   */
  async handleInitialNotification() {
    try {
      const remoteMessage = await getInitialNotification(messagingInstance);
      if (remoteMessage) {
        console.log('🔔 ============================================');
        console.log('🔔 [FCM] KILLED STATE TAP - App launched by tapping notification');
        console.log('🔔 [FCM] messageId:', remoteMessage.messageId);
        console.log('🔔 [FCM] notification:', JSON.stringify(remoteMessage.notification ?? null));
        console.log('🔔 [FCM] data:', JSON.stringify(remoteMessage.data ?? {}));
        console.log('🔔 ============================================');
        this.navigateFromData(remoteMessage.data ?? {});
      } else {
        console.log('🔔 [FCM] KILLED STATE - App launched normally (no notification tap)');
      }
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error handling initial notification:', error);
    }
  }

  /**
   * Handle tap on a LOCAL notification (from expo-notifications).
   * Used for data-only FCM messages that were scheduled as local notifications.
   */
  handleNotificationTap(notification) {
    const data = notification?.request?.content?.data ?? {};
    this.navigateFromData(data);
  }

  /**
   * Central navigation handler — routes user based on notification data.type.
   */
  navigateFromData(data) {
    if (!this.navigationRef) {
      console.warn('🔔 [NOTIFICATIONS] Navigation ref not set, cannot navigate');
      return;
    }

    // isReady() is available on the NavigationContainer imperative handle
    if (typeof this.navigationRef.isReady === 'function' && !this.navigationRef.isReady()) {
      console.warn('🔔 [NOTIFICATIONS] Navigation not ready yet, skipping navigate');
      return;
    }

    const type = data?.type;
    console.log('🔔 [NOTIFICATIONS] Navigating for notification type:', type);

    switch (type) {
      case 'STUDENT_WELCOME':
        if (data.studentId) {
          this.navigationRef.navigate('StudentDetail', { studentId: data.studentId });
        }
        break;

      case 'SESSION_REMINDER':
        this.navigationRef.navigate('Dashboard');
        break;

      case 'ENROLMENT_RECEIPT':
      case 'ENROLMENT_RENEWAL':
        this.navigationRef.navigate('WebView', { targetRoute: '/enrolment' });
        break;

      case 'SESSION_MISSED':
        this.navigationRef.navigate('Dashboard');
        break;

      case 'BIRTHDAY':
        this.navigationRef.navigate('Notifications');
        break;

      case 'GENERAL':
      default:
        this.navigationRef.navigate('Notifications');
        break;
    }
  }

  /**
   * Clear FCM token on logout.
   */
  async clearToken() {
    try {
      console.log('🔔 [NOTIFICATIONS] Clearing token...');

      const authToken = await AsyncStorage.getItem('auth_token');

      // Remove token from backend
      await axios.delete(`${API_URL}/fcm-token`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      await AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKEN);
      console.log('🔔 [NOTIFICATIONS] Token cleared');
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error clearing token:', error);
      // Don't throw — logout should continue even if token clearing fails
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
      console.error('🔔 [NOTIFICATIONS] Error clearing badge count:', error);
    }
  }

  /**
   * Cleanup all listeners on app unmount
   */
  cleanup() {
    console.log('🔔 [NOTIFICATIONS] Cleaning up listeners...');

    try {
      if (this.notificationListener) {
        this.notificationListener.remove();
        this.notificationListener = null;
      }

      if (this.responseListener) {
        this.responseListener.remove();
        this.responseListener = null;
      }

      if (this.backgroundOpenListener) {
        // onNotificationOpenedApp returns an unsubscribe function
        this.backgroundOpenListener();
        this.backgroundOpenListener = null;
      }

      if (this.tokenRefreshListener) {
        this.tokenRefreshListener();
        this.tokenRefreshListener = null;
      }

      this.isInitialized = false;
      console.log('🔔 [NOTIFICATIONS] Cleanup complete');
    } catch (error) {
      console.error('🔔 [NOTIFICATIONS] Error during cleanup:', error);
      this.notificationListener = null;
      this.responseListener = null;
      this.backgroundOpenListener = null;
      this.tokenRefreshListener = null;
      this.isInitialized = false;
    }
  }
}

export default new NotificationService();
