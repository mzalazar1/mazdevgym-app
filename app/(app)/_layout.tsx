import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

const TAB_ICON: Record<string, string> = {
  index: "🏠",
  routines: "💪",
  shifts: "📆",
  shop: "🛒",
  profile: "👤",
};

const TAB_LABEL: Record<string, string> = {
  index: "Inicio",
  routines: "Rutinas",
  shifts: "Turnos",
  shop: "Tienda",
  profile: "Perfil",
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabEmoji}>{TAB_ICON[name] ?? "•"}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {TAB_LABEL[name] ?? name}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="index" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="routines" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="shifts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="shop" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
  },
  tabIconContainer: {
    alignItems: "center",
    gap: 2,
    paddingTop: 6,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#2563eb",
  },
});
