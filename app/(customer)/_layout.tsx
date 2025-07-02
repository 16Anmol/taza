import { Tabs } from "expo-router"
import { Home, ShoppingCart, Heart, Settings } from "lucide-react-native"
import { View, StyleSheet } from "react-native"
import { useCart } from "../../contexts/CartContext"
import { Text } from "react-native"

export default function CustomerTabLayout() {
  const { itemCount } = useCart()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarShowLabel: false,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ size, color }) => <Home size={size} stroke={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ size, color }) => <Heart size={size} stroke={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ size, color }) => (
            <View style={styles.cartIconContainer}>
              <ShoppingCart size={size} stroke={color} strokeWidth={2} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ size, color }) => <Settings size={size} stroke={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="category/[slug]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 0,
    paddingBottom: 0,
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
  },
  cartIconContainer: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
})
