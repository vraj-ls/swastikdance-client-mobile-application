import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import authService from '../services/authService';
import Config from '../config';
import { colors, spacing, typography } from '../constants/theme';

const WEB_APP_URL = Config.WEB_APP_URL;

// Route to title mapping for native app bar
const ROUTE_TITLES = {
  '/enrolment': 'Class Enrolment',
  '/pass': 'Class Pass',
  '/training': 'Private Training',
  '/order': 'Products Order',
  '/performance': 'Event Performance',
  '/hire': 'Hall Hire',
  '/admission': 'Workshop Admission',
  '/transactions': 'Transactions',
  '': 'Swastik Dance', // Default for empty route
};

export default function WebViewScreen({ navigation, route }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webViewUrl, setWebViewUrl] = useState(null);
  const webViewRef = useRef(null);

  // Get target route from params (default to empty for enrolment page)
  const { targetRoute = '' } = route.params || {};

  // Set header title based on route
  useEffect(() => {
    const title = ROUTE_TITLES[targetRoute] || 'Swastik Dance';
    navigation.setOptions({
      title: title,
    });
  }, [targetRoute, navigation]);

  useEffect(() => {
    console.log('=== WebViewScreen MOUNTED ===');
    console.log('WebViewScreen: Target route:', targetRoute);
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

        // Build URL with token parameter directly to target page
        const targetPath = targetRoute || '/enrolment';
        const url = `${WEB_APP_URL}${targetPath}?token=${encodeURIComponent(savedToken)}`;

        console.log('WebViewScreen: Setting WebView URL with token parameter');
        console.log('WebViewScreen: Target URL:', url);

        // Validate URL
        if (!WEB_APP_URL || WEB_APP_URL.includes('localhost')) {
          console.warn('⚠️  WARNING: Using localhost URL - this will not work on physical devices!');
          console.warn('⚠️  Please update config.js with your computer\'s IP address');
        }

        setWebViewUrl(url);
      } else {
        console.log('WebViewScreen: No token found, navigating to Login...');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('WebViewScreen: Error loading token:', error);
      navigation.replace('Login');
    }
  };

  const handleNavigationStateChange = async (navState) => {
    const { url, loading, title, canGoBack, canGoForward } = navState;
    console.log('WebViewScreen: Navigation changed to:', url);
    console.log('WebViewScreen: Page title:', title);

    // Check if user navigated to login page (logout or session expired)
    if (url && url.includes('/login')) {
      console.log('WebViewScreen: Logout detected! User navigated to login page');
      console.log('WebViewScreen: Clearing tokens and navigating to native login...');

      await authService.clearAuth();
      console.log('WebViewScreen: Tokens cleared successfully');

      navigation.replace('Login');
    }
  };

  const handleWebViewLoad = () => {
    console.log('WebViewScreen: WebView loaded successfully');
    setLoading(false);

    // No need for post-load auth check anymore
    // Token is in URL, handled by MobileAuth page
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebViewScreen: WebView error:', nativeEvent);
    console.error('WebViewScreen: Error description:', nativeEvent.description);
    console.error('WebViewScreen: Error domain:', nativeEvent.domain);
    console.error('WebViewScreen: Error code:', nativeEvent.code);
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

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView Message:', message.type, message.data);
    } catch (e) {
      console.log('📱 WebView Message (raw):', event.nativeEvent.data);
    }
  };

  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebViewScreen: HTTP error:', nativeEvent);
    console.error('WebViewScreen: Status code:', nativeEvent.statusCode);
    console.error('WebViewScreen: URL:', nativeEvent.url);
  };

  if (!webViewUrl || !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {!token ? 'Loading token...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webview}
        onLoad={handleWebViewLoad}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleWebViewMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        allowsBackForwardNavigationGestures={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        onConsoleMessage={(message) => {
          console.log('WebView Console:', message.nativeEvent.message);
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.border,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});
