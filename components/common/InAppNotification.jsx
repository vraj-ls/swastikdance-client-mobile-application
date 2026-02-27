import React, { useEffect, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SLIDE_DURATION = 300;
const DISPLAY_DURATION = 4000;

export default function InAppNotification({ notification, onDismiss, onTap }) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notification) return;

    // Slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();

    // Auto dismiss after DISPLAY_DURATION
    const timer = setTimeout(() => {
      slideOut();
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [notification]);

  const slideOut = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start(() => onDismiss?.());
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.banner}
        onPress={() => {
          slideOut();
          onTap?.(notification);
        }}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <TouchableOpacity onPress={slideOut} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#E55A28",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E55A28",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    color: "#cccccc",
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
  closeText: {
    color: "#888888",
    fontSize: 13,
    fontWeight: "600",
  },
});
