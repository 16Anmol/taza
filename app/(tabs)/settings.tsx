"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
} from "react-native"
import { supabase, type Product } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

export default function SettingsScreen() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newPrice, setNewPrice] = useState("")
  const [newStockStatus, setNewStockStatus] = useState<"in_stock" | "out_of_stock">("in_stock")

  useEffect(() => {
    if (user) {
      fetchProducts()
      setupRealtimeSubscription()
    }
  }, [user])

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
      .channel("products_changes_settings")
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

  const onRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewPrice(product.price.toString())
    setNewStockStatus(product.stock_status)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || !newPrice.trim()) {
      Alert.alert("Error", "Please enter a valid price")
      return
    }

    const price = Number.parseFloat(newPrice)
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price")
      return
    }

    try {
      // Update product
      const { error: updateError } = await supabase
        .from("products")
        .update({
          price,
          stock_status: newStockStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id)

      if (updateError) throw updateError

      // Add to rate history if price changed
      if (price !== editingProduct.price) {
        const { error: historyError } = await supabase.from("rate_history").insert({
          product_id: editingProduct.id,
          mandi_id: user?.mandi_id,
          old_price: editingProduct.price,
          new_price: price,
          updated_at: new Date().toISOString(),
        })

        if (historyError) throw historyError
      }

      Alert.alert("Success", "Product updated successfully")
      setEditingProduct(null)
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      Alert.alert("Error", "Failed to update product")
    }
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: product.image_url || "/placeholder.svg?height=80&width=80" }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>₹{product.price}/kg</Text>
        <View style={[styles.stockBadge, product.stock_status === "in_stock" ? styles.inStock : styles.outOfStock]}>
          <Text style={styles.stockText}>{product.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(product)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Update product details</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity style={styles.updateButton}>
          <Text style={styles.updateButtonText}>📝 Update Details</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Products ({products.length})</Text>

        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {products.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products found</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Product Modal */}
      <Modal visible={!!editingProduct} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {editingProduct && (
              <>
                <Text style={styles.modalProductName}>{editingProduct.name}</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Price (₹/kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    keyboardType="numeric"
                    placeholder="Enter price"
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Stock Status</Text>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Out of Stock</Text>
                    <Switch
                      value={newStockStatus === "in_stock"}
                      onValueChange={(value) => setNewStockStatus(value ? "in_stock" : "out_of_stock")}
                    />
                    <Text style={styles.switchLabel}>In Stock</Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingProduct(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProduct}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  updateButton: {
    backgroundColor: "#2d5016",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
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
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
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
  editButton: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "white",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  modalProductName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  switchContainer: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2d5016",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
