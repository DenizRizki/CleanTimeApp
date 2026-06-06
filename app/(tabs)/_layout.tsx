import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#0f172a",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              size={22}
              name={focused ? "grid" : "grid-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* PESANAN */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Pesanan",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              size={22}
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              size={22}
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

// ── Styles Layout Tab ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 20,
    right: 20,
    borderRadius: 24,
    height: 64,
    paddingBottom: Platform.OS === "ios" ? 8 : 10,
    paddingTop: 10,
    borderTopWidth: 0,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
