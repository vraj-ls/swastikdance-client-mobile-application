import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import authService from '../services/authService';
import Config from '../config';

const WEB_APP_URL = Config.WEB_APP_URL;

export default function WebViewScreen({ navigation }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webViewUrl, setWebViewUrl] = useState(null);

  useEffect(() => {
    console.log('=== WebViewScreen MOUNTED ===');
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      console.log('WebViewScreen: Loading token from storage...');
      console.log('WebViewScreen: WEB_APP_URL configured as:', WEB_APP_URL);

      const savedToken = await authService.getToken();
      console.log('WebViewScreen: Token loaded:', savedToken ? 'YES (length: ' + savedToken.length + ')' : 'NO');

      if (savedToken) {
        setToken(savedToken);
        const url = `${WEB_APP_URL}/mobile-auth?token=${savedToken}`;
        console.log('WebViewScreen: Setting WebView URL:', url);

        // Validate URL
        if (!WEB_APP_URL || WEB_APP_URL.includes('localhost')) {
          console.warn('⚠️  WARNING: Using localhost URL - this will not work on physical devices!');
          console.warn('⚠️  Please update config.js with your computer\'s IP address');
        }

        setWebViewUrl(url);
      } else {
        // No token found, navigate to login
        console.log('WebViewScreen: No token found, navigating to Login...');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('WebViewScreen: Error loading token:', error);
      navigation.replace('Login');
    }
  };

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log('WebViewScreen: Navigation changed to:', url);

    // Check if user navigated to login page (logout or session expired)
    if (url && url.includes('/login')) {
      console.log('WebViewScreen: Logout detected! User navigated to login page');
      console.log('WebViewScreen: Clearing tokens and navigating to native login...');

      // Clear tokens from AsyncStorage
      await authService.clearAuth();
      console.log('WebViewScreen: Tokens cleared successfully');

      // Navigate back to native login screen
      navigation.replace('Login');
    }
  };

  const handleWebViewLoad = () => {
    console.log('WebViewScreen: WebView loaded successfully');
    setLoading(false);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebViewScreen: WebView error:', nativeEvent);
    Alert.alert(
      'Connection Error',
      'Unable to load the app. Please check your internet connection.',
      [
        { text: 'Retry', onPress: loadToken },
        {
          text: 'Go Back',
          onPress: async () => {
            await authService.clearAuth();
            navigation.replace('Login');
          },
          style: 'destructive'
        },
      ]
    );
  };

  if (!webViewUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF10F0" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* WebView */}
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF10F0" />
          </View>
        )}
        // Allow navigation within the web app
        allowsBackForwardNavigationGestures={true}
        // Enable JavaScript
        javaScriptEnabled={true}
        // Allow cookies for session management
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF10F0" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
