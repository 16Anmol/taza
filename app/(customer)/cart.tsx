"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from "react-native"
import { Plus, Minus, Trash2, ShoppingBag, MapPin } from "lucide-react-native"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { createOrder } from "../../services/supabase"
import { router } from "expo-router"
import * as Location from "expo-location"

export default function CartScreen() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()

  const handleQuantityChange = (id: string, change: number) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      const newQuantity = item.quantity + change
      if (newQuantity <= 0) {
        removeItem(id)
      } else {
        updateQuantity(id, newQuantity)
      }
    }
  }

  const getCurrentLocation = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        return user?.address || "Address not provided"
      }

      const location = await Location.getCurrentPositionAsync({})
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (address.length > 0) {
        const addr = address[0]
        return (
          `${addr.street || ""} ${addr.city || ""} ${addr.region || ""}`.trim() || user?.address || "Current Location"
        )
      }

      return user?.address || "Current Location"
    } catch (error) {
      console.log("Location error:", error)
      return user?.address || "Address not provided"
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Please login to place order")
      return
    }

    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty")
      return
    }

    try {
      // Get user location
      const location = await getCurrentLocation()

      // Create order
      const orderData = {
        user_id: user.id,
        location: location,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
        total_cost: total,
        status: "pending" as const,
      }

      await createOrder(orderData)

      Alert.alert(
        "Order Placed Successfully!",
        `Your order of ₹${total.toFixed(2)} has been placed. You will receive updates soon.`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart()
              router.push("/(customer)")
            },
          },
        ],
      )
    } catch (error) {
      console.error("Failed to place order:", error)
      Alert.alert("Error", "Failed to place order. Please try again.")
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} stroke="#CBD5E1" strokeWidth={1} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some fresh vegetables and fruits to get started</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push("/(customer)")}>
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cartItems}>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image 
                source={{ 
                  uri: item.image || "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=80" 
                }} 
                style={styles.itemImage} 
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  ₹{item.price}/{item.unit}
                </Text>
                <View style={styles.itemControls}>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, -0.5)}>
                      <Minus size={16} stroke="#D97706" strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, 0.5)}>
                      <Plus size={16} stroke="#D97706" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
                    <Trash2 size={16} stroke="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.itemTotal}>
                <Text style={styles.itemTotalPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.deliveryInfo}>
          <MapPin size={16} stroke="#D97706" />
          <Text style={styles.deliveryText}>Delivery to: {user?.address || "Current Location"}</Text>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalPrice}>₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handlePlaceOrder}>
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: "#64748B",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  cartItems: {
    gap: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: "cover",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FED7AA",
    borderWidth: 1,
    borderColor: "#D97706",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: "center",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  itemTotal: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D97706",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 110,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FED7AA",
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D97706",
  },
  checkoutButton: {
    backgroundColor: "#D97706",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#D97706",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})