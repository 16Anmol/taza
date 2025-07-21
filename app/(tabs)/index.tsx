import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, RefreshControl, Alert } from "react-native"
import { router } from "expo-router"
import { supabase, type Product } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

type CategoryFilter = "all" | "fruits" | "vegetables" | "others"

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProducts()
      setupRealtimeSubscription()
    }
  }, [user])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("mandi_id", user?.mandi_id).order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      Alert.alert("Error", "Failed to fetch products")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `mandi_id=eq.${user?.mandi_id}`,
        },
        () => {
          fetchProducts()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const filterProducts = () => {
    if (selectedCategory === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((product) => product.category === selectedCategory))
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ])
  }

  const CategoryButton = ({ category, title }: { category: CategoryFilter; title: string }) => (
    <TouchableOpacity
      style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const ProductCard = ({ product }: { product: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1" }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>₹{product.price}/kg</Text>
        <View style={[styles.stockBadge, product.stock_status === "in_stock" ? styles.inStock : styles.outOfStock]}>
          <Text style={styles.stockText}>{product.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}</Text>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.mandiName}>{user?.mandi_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/rate-history")}>
          <Text style={styles.actionButtonText}>📈 View Rate History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/products")}>
          <Text style={styles.actionButtonText}>📋 View All Products</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        <CategoryButton category="all" title="All" />
        <CategoryButton category="fruits" title="Fruits" />
        <CategoryButton category="vegetables" title="Vegetables" />
        <CategoryButton category="others" title="Others" />
      </ScrollView>

      {/* Products List */}
      <ScrollView
        style={styles.productsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>
          {selectedCategory === "all"
            ? "All Products"
            : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}{" "}
          ({filteredProducts.length})
        </Text>

        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products found</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  mandiName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d5016",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ff4444",
    borderRadius: 6,
  },
  logoutText: {
    color: "white",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#2d5016",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryButtonActive: {
    backgroundColor: "#2d5016",
    borderColor: "#2d5016",
  },
  categoryButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: "white",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d5016",
    marginBottom: 8,
  },
  stockBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: "#e8f5e8",
  },
  outOfStock: {
    backgroundColor: "#ffe8e8",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
  },
})