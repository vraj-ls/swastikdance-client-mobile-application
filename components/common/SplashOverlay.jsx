import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Animated JS splash overlay shown after the native splash hides.
 * Fades in logo + name, then calls onFinish() when done.
 */
export default function SplashOverlay({ onFinish }) {
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.82)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const rootOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // This overlay covers the full screen with #1a1a1a from the moment it mounts,
    // so it's safe to dismiss the native splash here — no white frame possible.
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      // 1. Fade + scale logo in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // 2. Fade text in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Hold
      Animated.delay(700),
      // 4. Fade entire overlay out
      Animated.timing(rootOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: rootOpacity }]} pointerEvents="none">
      <Animated.Image
        source={require('../../assets/SD_Logo.png')}
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.name, { opacity: textOpacity }]}>
        Swastik Institute of Dance
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
