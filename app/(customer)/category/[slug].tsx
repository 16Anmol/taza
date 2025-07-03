"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  RefreshControl,
} from "react-native"
import { ArrowLeft, Plus, Minus } from "lucide-react-native"
import { router, useLocalSearchParams } from "expo-router"
import { getProductsByCategory, type Product } from "../../../services/supabase"
import { useCart } from "../../../contexts/CartContext"

const categoryTitles: Record<string, string> = {
  fruits: "Fresh Fruits",
  vegetables: "Fresh Vegetables", 
  seasonal: "Seasonal Items",
  others: "Other Items"
}

const categoryColors: Record<string, string> = {
  fruits: "#EF4444",
  vegetables: "#22C55E",
  seasonal: "#F59E0B", 
  others: "#8B5CF6"
}

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const { addItem } = useCart()

  const categoryType = slug === "fruits" ? "fruit" : slug === "vegetables" ? "vegetable" : slug

  useEffect(() => {
    loadProducts()
  }, [slug])

  const loadProducts = async () => {
    try {
      const data = await getProductsByCategory(categoryType)
      setProducts(data)
    } catch (error) {
      console.error("Failed to load category products:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }

  const updateQuantity = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }))
  }

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1
    if (quantity > 0 && quantity <= product.stock) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: "kg",
        image: product.image_url,
        quantity: quantity
      })
      // Reset quantity after adding to cart
      setQuantities(prev => ({ ...prev, [product.id]: 0 }))
    }
  }

  const renderProductGrid = () => {
    const rows = []
    for (let i = 0; i < products.length; i += 3) {
      const rowProducts = products.slice(i, i + 3)
      rows.push(
        <View key={i} style={styles.productRow}>
          {rowProducts.map((product) => {
            const quantity = quantities[product.id] || 0
            return (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={{ 
                    uri: product.image_url || "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=200" 
                  }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>₹{product.price}/kg</Text>
                  <Text style={styles.stockText}>Stock: {product.stock} kg</Text>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(product.id, -0.5)}
                    >
                      <Minus size={16} stroke="#D97706" strokeWidth={2} />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity.toString()}
                      onChangeText={(text) => {
                        const num = parseFloat(text) || 0
                        setQuantities(prev => ({ ...prev, [product.id]: num }))
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(product.id, 0.5)}
                    >
                      <Plus size={16} stroke="#D97706" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addToCartButton,
                      (product.stock === 0 || quantity === 0 || quantity > product.stock) && styles.disabledButton
                    ]}
                    onPress={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || quantity === 0 || quantity > product.stock}
                  >
                    <Text style={styles.addToCartText}>
                      {product.stock === 0 ? "Out of Stock" : 
                       quantity === 0 ? "Select Quantity" :
                       quantity > product.stock ? "Exceeds Stock" :
                       "Add to Cart"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
          {/* Fill empty spaces in the row */}
          {rowProducts.length < 3 && (
            Array.from({ length: 3 - rowProducts.length }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptyCard} />
            ))
          )}
        </View>
      )
    }
    return rows
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: categoryColors[slug] || "#D97706" }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryTitles[slug] || "Products"}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptySubtitle}>Check back later for fresh items</Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            {renderProductGrid()}
          </View>
        )}
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
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  productsContainer: {
    flex: 1,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  productImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  quantityInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: "center",
    fontSize: 14,
    color: "#1E293B",
  },
  addToCartButton: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})