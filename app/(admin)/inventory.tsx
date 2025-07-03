"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from "react-native"
import { Plus, CreditCard as Edit3, Trash2, Package, Search } from "lucide-react-native"
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  subscribeToProducts, 
  type Product 
} from "../../services/supabase"

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "vegetable" as "fruit" | "vegetable" | "seasonal" | "others",
    price: "",
    stock: "",
    image_url: "",
  })

  useEffect(() => {
    loadProducts()

    // Subscribe to real-time updates
    const subscription = subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts)
      filterProducts(updatedProducts, searchQuery)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    filterProducts(products, searchQuery)
  }, [searchQuery, products])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    }
  }

  const filterProducts = (productList: Product[], query: string) => {
    if (!query.trim()) {
      setFilteredProducts(productList)
    } else {
      const filtered = productList.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.type.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "vegetable",
      price: "",
      stock: "",
      image_url: "",
    })
    setEditingProduct(null)
  }

  const handleAddProduct = () => {
    resetForm()
    setModalVisible(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      type: product.type,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url || "",
    })
    setModalVisible(true)
  }

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product.id)
              Alert.alert("Success", "Product deleted successfully")
            } catch (error) {
              Alert.alert("Error", "Failed to delete product")
            }
          },
        },
      ]
    )
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const price = parseFloat(formData.price)
    const stock = parseInt(formData.stock)

    if (isNaN(price) || isNaN(stock) || price <= 0 || stock < 0) {
      Alert.alert("Error", "Please enter valid price and stock values")
      return
    }

    try {
      const productData = {
        name: formData.name.trim(),
        type: formData.type,
        price: price,
        stock: stock,
        image_url: formData.image_url.trim() || undefined,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
        Alert.alert("Success", "Product updated successfully")
      } else {
        await addProduct(productData)
        Alert.alert("Success", "Product added successfully")
      }

      setModalVisible(false)
      resetForm()
    } catch (error) {
      Alert.alert("Error", "Failed to save product")
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", color: "#EF4444" }
    if (stock < 10) return { text: "Low Stock", color: "#F59E0B" }
    return { text: "In Stock", color: "#22C55E" }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fruit": return "#EF4444"
      case "vegetable": return "#22C55E"
      case "seasonal": return "#F59E0B"
      case "others": return "#8B5CF6"
      default: return "#64748B"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Inventory Management</Text>
            <Text style={styles.subtitle}>Manage products and stock levels</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} stroke="#94A3B8" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#EF4444" }]}>
              {products.filter(p => p.stock === 0).length}
            </Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
              {products.filter(p => p.stock > 0 && p.stock < 10).length}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "Try adjusting your search" : "Add your first product to get started"}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock)
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(product.type) }]}>
                        <Text style={styles.typeText}>{product.type}</Text>
                      </View>
                      <Text style={styles.productPrice}>₹{product.price}/kg</Text>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Edit3 size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteProduct(product)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stockInfo}>
                  <View style={styles.stockRow}>
                    <Text style={styles.stockLabel}>Stock:</Text>
                    <Text style={styles.stockValue}>{product.stock} kg</Text>
                  </View>
                  <View style={[styles.stockStatus, { backgroundColor: stockStatus.color }]}>
                    <Text style={styles.stockStatusText}>{stockStatus.text}</Text>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </Text>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter product name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <View style={styles.typeSelector}>
                  {(["vegetable", "fruit", "seasonal", "others"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        formData.type === type && styles.typeOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        formData.type === type && styles.typeOptionTextSelected
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹/kg) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="Enter price"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock (kg) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                  placeholder="Enter stock quantity"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Image URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.image_url}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, image_url: text }))}
                  placeholder="Enter image URL"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveButtonText}>
                  {editingProduct ? "Update" : "Add"} Product
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1E293B",
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  productCard: {
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
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stockInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockLabel: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  stockStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "center",
  },
  modalForm: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  typeOptionSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  typeOptionText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  typeOptionTextSelected: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})