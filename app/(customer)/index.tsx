"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  RefreshControl,
} from "react-native"
import { Search, User, Apple, Leaf, Calendar, Grid3x3 as Grid3X3 } from "lucide-react-native"
import { router } from "expo-router"
import { getProducts, searchProducts, subscribeToProducts, type Product } from "../../services/supabase"
import { useCart } from "../../contexts/CartContext"

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  color: string
  image: string
  type: "fruit" | "vegetable" | "seasonal" | "others"
}

const categories: Category[] = [
  {
    id: "seasonal",
    name: "Seasonal",
    icon: <Calendar size={20} stroke="#FFFFFF" strokeWidth={2} />,
    count: 0,
    color: "#F59E0B",
    image: "https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=300",
    type: "seasonal",
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: <Apple size={20} stroke="#FFFFFF" strokeWidth={2} />,
    count: 0,
    color: "#EF4444",
    image: "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300",
    type: "fruit",
  },
  {
    id: "vegetables",
    name: "Vegetables",
    icon: <Leaf size={20} stroke="#FFFFFF" strokeWidth={2} />,
    count: 0,
    color: "#22C55E",
    image: "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=300",
    type: "vegetable",
  },
  {
    id: "others",
    name: "Others",
    icon: <Grid3X3 size={20} stroke="#FFFFFF" strokeWidth={2} />,
    count: 0,
    color: "#8B5CF6",
    image: "https://images.pexels.com/photos/161556/ginger-plant-asia-rhizome-161556.jpeg?auto=compress&cs=tinysrgb&w=300",
    type: "others",
  },
]

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    loadProducts()

    // Subscribe to real-time updates
    const subscription = subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch()
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchProducts(searchQuery.trim())
      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/(customer)/category/${categoryId}`)
  }

  const handleProfilePress = () => {
    router.push("/(customer)/profile")
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: "kg",
      image: product.image_url,
    })
  }

  // Get fresh picks (latest products with stock)
  const freshPicks = products.filter((p) => p.stock > 0).slice(0, 6)

  // Update category counts
  const updatedCategories = categories.map((cat) => ({
    ...cat,
    count: products.filter((p) => {
      if (cat.type === "seasonal") return p.type === "seasonal"
      return p.type === cat.type
    }).length,
  }))

  const displayProducts = isSearching ? searchResults : freshPicks

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} stroke="#94A3B8" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables, fruits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          <User size={24} stroke="#D97706" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!isSearching && (
          <>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Good Morning!</Text>
              <Text style={styles.welcomeSubtext}>What would you like to buy today?</Text>
            </View>

            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContainer}
              >
                {updatedCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => handleCategoryPress(category.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.categoryCircle, { backgroundColor: category.color }]}>
                      <Image source={{ uri: category.image }} style={styles.categoryBackgroundImage} />
                      <View style={styles.categoryOverlay}>{category.icon}</View>
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{category.count} items</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isSearching ? `Search Results (${searchResults.length})` : "Fresh Picks"}
            </Text>
            {!isSearching && <Text style={styles.sectionSubtitle}>Latest additions & best deals</Text>}
          </View>
          
          {displayProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {isSearching ? "No products found for your search" : "No products available"}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContainer}
            >
              {displayProducts.map((product) => (
                <TouchableOpacity key={product.id} style={styles.featuredCard}>
                  <View style={styles.featuredImageContainer}>
                    <Image
                      source={{ uri: product.image_url || "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=160" }}
                      style={styles.featuredImage}
                    />
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>FRESH</Text>
                    </View>
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{product.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.featuredPrice}>₹{product.price}</Text>
                      <Text style={styles.priceUnit}>/kg</Text>
                    </View>
                    <Text style={styles.stockText}>Stock: {product.stock} kg</Text>
                    <TouchableOpacity 
                      style={[styles.addButton, product.stock === 0 && styles.disabledButton]} 
                      onPress={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <Text style={styles.addButtonText}>
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {!isSearching && (
          <View style={styles.promotionSection}>
            <View style={styles.promotionCard}>
              <View style={styles.promotionContent}>
                <Text style={styles.promotionTitle}>Special Offer</Text>
                <Text style={styles.promotionText}>Get 20% off on your first order above ₹500</Text>
                <TouchableOpacity style={styles.promotionButton}>
                  <Text style={styles.promotionButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
              <Image 
                source={{ uri: "https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=80" }} 
                style={styles.promotionImage} 
              />
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D97706",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#64748B",
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesScrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 24,
    width: 80,
  },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  categoryBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.3,
  },
  categoryOverlay: {
    zIndex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  featuredSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  featuredScrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  featuredCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImageContainer: {
    position: "relative",
  },
  featuredImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#D97706",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D97706",
  },
  priceUnit: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 2,
  },
  stockText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  promotionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  promotionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  promotionContent: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  promotionText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 20,
  },
  promotionButton: {
    backgroundColor: "#D97706",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  promotionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  promotionImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginLeft: 16,
  },
})