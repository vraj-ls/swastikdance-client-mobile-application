import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Bell,
  Home,
  User,
  Plus,
  X,
  Ticket,
  FileText,
  UserPlus,
  Dumbbell,
  BookOpen,
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

  const menuItems = [
    { id: 1, label: "Pass", icon: "ticket" },
    { id: 2, label: "Enrolment", icon: "fileText" },
    { id: 3, label: "Training", icon: "dumbbell" },
    { id: 4, label: "Course", icon: "bookOpen" },
  ];

  const getMenuIcon = (iconName) => {
    const iconProps = { color: "#E55A28", size: 20 };
    switch (iconName) {
      case "ticket":
        return <Ticket {...iconProps} />;
      case "fileText":
        return <FileText {...iconProps} />;
      case "userPlus":
        return <UserPlus {...iconProps} />;
      case "dumbbell":
        return <Dumbbell {...iconProps} />;
      case "bookOpen":
        return <BookOpen {...iconProps} />;
      default:
        return null;
    }
  };

  const handleMenuItemPress = (item) => {
    setIsMenuVisible(false);
    // Handle menu item action
    console.log("Menu item pressed:", item.label);
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
          style={styles.modalOverlay}
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
        style={styles.fab}
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
            backgroundColor: "#ffffff",
            borderTopColor: "#e5e7eb",
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
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
    paddingTop: 4,
    width: "100%",
    maxWidth: 80,
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
    bottom: 80,
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
    paddingBottom: 150,
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
