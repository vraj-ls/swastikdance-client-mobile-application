import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FCM_CHANNEL_ID } from './services/notificationService';

// Background/killed-state FCM handler MUST be registered here (index.js),
// before registerRootComponent, so the native side finds it immediately.
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('🔔 ============================================');
  console.log('🔔 [FCM] BACKGROUND/KILLED STATE - Message received');
  console.log('🔔 [FCM] messageId:', remoteMessage.messageId);
  console.log('🔔 [FCM] notification payload:', JSON.stringify(remoteMessage.notification ?? null));
  console.log('🔔 [FCM] data payload:', JSON.stringify(remoteMessage.data ?? {}));
  console.log('🔔 ============================================');

  if (!remoteMessage.notification) {
    console.log('🔔 [FCM] Data-only message — scheduling local notification manually');
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(FCM_CHANNEL_ID, {
        name: 'Swastik Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E55A28',
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.data?.title ?? 'Swastik Dance',
        body: remoteMessage.data?.body ?? '',
        data: remoteMessage.data ?? {},
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: FCM_CHANNEL_ID }),
      },
      trigger: null,
    });
    console.log('🔔 [FCM] Local notification scheduled successfully');
  } else {
    console.log('🔔 [FCM] Notification message — iOS/Android will display it automatically');
  }
});

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
