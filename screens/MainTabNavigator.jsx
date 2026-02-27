import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Modal, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Bell,
  Home,
  User,
  Plus,
  X,
  Ticket,
  FileText,
  BookOpen,
  GraduationCap,
} from "lucide-react-native";
import DashboardScreen from "./DashboardScreen";
import NotificationScreen from "./NotificationScreen";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ focused, label }) => {
  const iconColor = focused ? "#E55A28" : "#9ca3af";
  const iconSize = 24;

  const getIcon = () => {
    switch (label) {
      case "Alerts":
        return <Bell color={iconColor} size={iconSize} />;
      case "Dashboard":
        return <Home color={iconColor} size={iconSize} />;
      case "Profile":
        return <User color={iconColor} size={iconSize} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      {getIcon()}
    </View>
  );
};

// Floating Action Button with Menu
const FloatingActionButton = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Position FAB above the tab bar with proper spacing
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;
  const fabBottom = TAB_BAR_HEIGHT + insets.bottom + 32;

  const menuItems = [
    { id: 1, label: "Pass", icon: "ticket", route: "/pass" },
    { id: 2, label: "Enrolment", icon: "fileText", route: "/enrolment" },
    { id: 4, label: "Products", icon: "bookOpen", route: "/order" },
    { id: 7, label: "Workshop", icon: "graduationCap", route: "/admission" },
  ];

  const getMenuIcon = (iconName) => {
    const iconProps = { color: "#E55A28", size: 20 };
    switch (iconName) {
      case "ticket":
        return <Ticket {...iconProps} />;
      case "fileText":
        return <FileText {...iconProps} />;
      case "bookOpen":
        return <BookOpen {...iconProps} />;
      case "graduationCap":
        return <GraduationCap {...iconProps} />;
      default:
        return null;
    }
  };

  const handleMenuItemPress = (item) => {
    setIsMenuVisible(false);
    // Navigate to WebView with the target route
    console.log("Menu item pressed:", item.label, "- navigating to:", item.route);
    navigation.navigate("WebView", { targetRoute: item.route });
  };

  return (
    <>
      {/* Floating Menu */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { paddingBottom: fabBottom + 70 }]}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { marginBottom: index === menuItems.length - 1 ? 0 : 12 },
                ]}
                onPress={() => handleMenuItemPress(item)}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuIconContainer}>
                    {getMenuIcon(item.icon)}
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => setIsMenuVisible(!isMenuVisible)}
        activeOpacity={0.8}
      >
        {isMenuVisible ? (
          <X color="#ffffff" size={28} strokeWidth={3} />
        ) : (
          <Plus color="#ffffff" size={28} strokeWidth={3} />
        )}
      </TouchableOpacity>
    </>
  );
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  // Calculate tab bar height based on platform and safe area
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: "#ffffff",
            borderTopColor: "#e5e7eb",
            borderTopWidth: 0.5,
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "#E55A28",
          tabBarInactiveTintColor: "#6b7280",
        }}
      >
        <Tab.Screen
          name="Notification"
          component={NotificationScreen}
          options={{
            title: "Notifications",
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} label="Alerts" />
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} label="Dashboard" />
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} label="Profile" />
            ),
            tabBarLabel: () => null,
          }}
        />
      </Tab.Navigator>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  // Tab Icon Styles
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  tabLabel: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
    width: "100%",
  },
  tabLabelFocused: {
    color: "#E55A28",
    fontWeight: "600",
  },
  // FAB Styles
  fab: {
    position: "absolute",
    right: 20,
    // bottom is now set dynamically based on safe area
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  // Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    // paddingBottom is now set dynamically based on safe area
    paddingRight: 20,
  },
  menuContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginRight: 0,
    minWidth: 200,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menuItem: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconContainer: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
});
