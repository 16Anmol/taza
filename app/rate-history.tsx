"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { supabase, type RateHistory } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

export default function RateHistoryScreen() {
  const { user } = useAuth()
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRateHistory()
      setupRealtimeSubscription()
    }
  }, [user])

  const fetchRateHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("rate_history")
        .select(
          `
          *,
          products (
            name
          )
        `,
        )
        .eq("mandi_id", user?.mandi_id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setRateHistory(data || [])
    } catch (error) {
      console.error("Error fetching rate history:", error)
      Alert.alert("Error", "Failed to fetch rate history")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("rate_history_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rate_history",
          filter: `mandi_id=eq.${user?.mandi_id}`,
        },
        () => {
          fetchRateHistory()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRateHistory()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return "📈"
    if (newPrice < oldPrice) return "📉"
    return "➡️"
  }

  const getPriceChangeColor = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return "#22c55e"
    if (newPrice < oldPrice) return "#ef4444"
    return "#6b7280"
  }

  const groupedHistory = rateHistory.reduce(
    (acc, item) => {
      const date = formatDate(item.updated_at)
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    },
    {} as Record<string, RateHistory[]>,
  )

  const RateHistoryItem = ({ item }: { item: RateHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.productName}>{item.products.name}</Text>
        <Text style={styles.timeText}>{formatTime(item.updated_at)}</Text>
      </View>
      <View style={styles.priceChange}>
        <Text style={styles.priceChangeIcon}>{getPriceChangeIcon(item.old_price, item.new_price)}</Text>
        <Text style={styles.oldPrice}>₹{item.old_price}/kg</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={[styles.newPrice, { color: getPriceChangeColor(item.old_price, item.new_price) }]}>
          ₹{item.new_price}/kg
        </Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading rate history...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate History</Text>
        <Text style={styles.subtitle}>{user?.mandi_name}</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.entries(groupedHistory).map(([date, items]) => (
          <View key={date} style={styles.dateSection}>
            <Text style={styles.dateHeader}>{date}</Text>
            {items.map((item) => (
              <RateHistoryItem key={item.id} item={item} />
            ))}
          </View>
        ))}

        {rateHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No rate history found</Text>
            <Text style={styles.emptyStateSubtext}>Price changes will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2d5016",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d5016",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateSection: {
    marginVertical: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
  priceChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceChangeIcon: {
    fontSize: 16,
  },
  oldPrice: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "line-through",
  },
  arrow: {
    fontSize: 14,
    color: "#666",
  },
  newPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
  },
})
