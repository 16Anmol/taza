"use client"

import { useState, useEffect, SetStateAction, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Clock, MapPin, Package, User } from "lucide-react-native"
import { getOrders, updateOrderStatus, subscribeToOrders, type Order } from "../../services/supabase"

type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"

const statusColors: Record<OrderStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  out_for_delivery: "#10B981",
  delivered: "#22C55E",
  cancelled: "#EF4444",
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const subscription = subscribeToOrders((updatedOrders: SetStateAction<Order[]>) => {
      setOrders(updatedOrders)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadOrders = async () => {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Failed to load orders:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    Alert.alert("Update Order Status", `Change status to ${statusLabels[newStatus]}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await updateOrderStatus(orderId, newStatus)
            Alert.alert("Success", `Order status updated to ${statusLabels[newStatus]}`)
          } catch (error) {
            Alert.alert("Error", "Failed to update order status")
          }
        },
      },
    ])
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"]
    const currentIndex = statusFlow.indexOf(currentStatus)
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })
  }

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      inProgress: orders.filter(
        (o) => o.status === "confirmed" || o.status === "preparing" || o.status === "out_for_delivery",
      ).length,
    }
  }

  const stats = getOrderStats()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Live Orders</Text>
            <Text style={styles.subtitle}>Manage customer orders in real-time</Text>
          </View>
          <View style={styles.headerIcon}>
            <Package size={32} color="#3B82F6" />
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#3B82F6" }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          orders.map((order) => {
            const nextStatus = getNextStatus(order.status as OrderStatus)
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <View style={styles.customerInfo}>
                      <User size={16} color="#6B7280" />
                      <Text style={styles.customerName}>Customer #{order.user_id}</Text>
                    </View>
                    <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status as OrderStatus] }]}>
                      <Text style={styles.statusText}>{statusLabels[order.status as OrderStatus]}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.detailText} numberOfLines={2}>
                      {order.location}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatDate(order.timestamp)} at {formatTime(order.timestamp)}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemsContainer}>
                  <View style={styles.itemsHeader}>
                    <Package size={16} color="#6B7280" />
                    <Text style={styles.itemsTitle}>Items ({order.items.length})</Text>
                  </View>
                  {order.items.map((item: { product_name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; quantity: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; unit: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; price: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined }, index: Key | null | undefined) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} {item.unit}
                      </Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>₹{order.total_cost}</Text>
                  </View>
                </View>

                {nextStatus && order.status !== "delivered" && order.status !== "cancelled" && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: statusColors[nextStatus] }]}
                    onPress={() => handleUpdateOrderStatus(order.id, nextStatus)}
                  >
                    <Text style={styles.actionButtonText}>Mark as {statusLabels[nextStatus]}</Text>
                  </TouchableOpacity>
                )}

                {order.status === "delivered" && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Order Completed</Text>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2E8F0",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  orderId: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  itemsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    color: "#64748B",
    flex: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  completedBadge: {
    backgroundColor: "#F0FDF4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  completedText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "600",
  },
})
