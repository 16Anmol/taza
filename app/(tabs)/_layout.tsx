import { Tabs } from "expo-router"
import { useColorScheme } from "@/hooks/useColorScheme"
import { Colors } from "@/constants/Colors"
import { Text, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => <Text style={{ color, fontSize: focused ? 20 : 16 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => <Text style={{ color, fontSize: focused ? 20 : 16 }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => <Text style={{ color, fontSize: focused ? 20 : 16 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}
