"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from "react-native"
import { ArrowLeft, User, Phone, MapPin, Package, Clock, CheckCircle } from "lucide-react-native"
import { router } from "expo-router"
import { useAuth } from "../../contexts/AuthContext"
import { getUserOrders, type Order } from "../../services/supabase"

const statusColors: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  out_for_delivery: "#10B981",
  delivered: "#22C55E",
  cancelled: "#EF4444",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserOrders()
    }
  }, [user])

  const loadUserOrders = async () => {
    if (!user) return
    
    try {
      const userOrders = await getUserOrders(user.id)
      setOrders(userOrders)
    } catch (error) {
      console.error("Failed to load user orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserOrders()
    setRefreshing(false)
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout()
              router.replace("/(auth)/welcome")
            } catch (error) {
              Alert.alert("Error", "Failed to logout")
            }
          },
        },
      ]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please login to view profile</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#D97706" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={styles.userInfoCard}>
          <View style={styles.userIconContainer}>
            <User size={32} color="#D97706" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.userInfoRow}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.userInfoText}>{user.phone}</Text>
            </View>
            <View style={styles.userInfoRow}>
              <MapPin size={16} color="#64748B" />
              <Text style={styles.userInfoText}>{user.address}</Text>
            </View>
          </View>
        </View>

        {/* Order History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order History</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <Package size={48} color="#94A3B8" />
              <Text style={styles.emptyOrdersTitle}>No Orders Yet</Text>
              <Text style={styles.emptyOrdersSubtitle}>Start shopping to see your orders here</Text>
            </View>
          ) : (
            <View style={styles.ordersContainer}>
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.timestamp)} at {formatTime(order.timestamp)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] }]}>
                      <Text style={styles.statusText}>{statusLabels[order.status]}</Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderLocation}>
                      <MapPin size={14} color="#64748B" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {order.location}
                      </Text>
                    </View>

                    <View style={styles.orderItems}>
                      <Text style={styles.itemsTitle}>Items ({order.items.length})</Text>
                      {order.items.slice(0, 2).map((item, index) => (
                        <Text key={index} style={styles.itemText}>
                          {item.product_name} - {item.quantity} {item.unit}
                        </Text>
                      ))}
                      {order.items.length > 2 && (
                        <Text style={styles.moreItemsText}>
                          +{order.items.length - 2} more items
                        </Text>
                      )}
                    </View>

                    <View style={styles.orderTotal}>
                      <Text style={styles.totalLabel}>Total: </Text>
                      <Text style={styles.totalAmount}>₹{order.total_cost}</Text>
                    </View>
                  </View>

                  {order.status === "delivered" && (
                    <View style={styles.deliveredBadge}>
                      <CheckCircle size={16} color="#22C55E" />
                      <Text style={styles.deliveredText}>Order Completed</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
  },
  userInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  emptyOrdersContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyOrdersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOrdersSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  ordersContainer: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
    flex: 1,
  },
  orderItems: {
    marginBottom: 8,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
  },
  orderTotal: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D97706",
  },
  deliveredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  deliveredText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginLeft: 6,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})