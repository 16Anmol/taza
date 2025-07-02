import { createClient } from "@supabase/supabase-js"
import { mockDB, type Product, type Order, type OrderItem } from "./mockData"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://hrgapinaqitffwpofmmz.supabase.co"
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ2FwaW5hcWl0ZmZ3cG9mbW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDE0NTYsImV4cCI6MjA2Njg3NzQ1Nn0.4TOoMJwrtGzoV60JL6FjGtudEm8tqUhDJEl3srmujoo"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if Supabase is available
const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("inventory").select("count", { count: "exact", head: true })
    return !error
  } catch {
    return false
  }
}

// Product operations with fallback to mock data
export const getProducts = async (): Promise<Product[]> => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase.from("inventory").select("*").order("name")
      if (error) throw error
      return data || []
    }
  } catch (error) {
    console.log("Using mock data for products")
  }

  // Fallback to mock data
  return await mockDB.getProducts()
}

export const addProduct = async (product: Omit<Product, "id" | "created_at" | "updated_at">) => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase.from("inventory").insert([product]).select().single()
      if (error) throw error
      return data
    }
  } catch (error) {
    console.log("Using mock data for adding product")
  }

  // Fallback to mock data
  return await mockDB.addProduct(product)
}

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase
        .from("inventory")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  } catch (error) {
    console.log("Using mock data for updating product")
  }

  // Fallback to mock data
  return await mockDB.updateProduct(id, updates)
}

export const deleteProduct = async (id: string) => {
  try {
    if (await isSupabaseAvailable()) {
      const { error } = await supabase.from("inventory").delete().eq("id", id)
      if (error) throw error
      return
    }
  } catch (error) {
    console.log("Using mock data for deleting product")
  }

  // Fallback to mock data
  await mockDB.deleteProduct(id)
}

// Order operations with fallback to mock data
export const createOrder = async (order: Omit<Order, "id" | "timestamp">) => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase
        .from("orders")
        .insert([{ ...order, timestamp: new Date().toISOString() }])
        .select()
        .single()
      if (error) throw error

      // Update inventory
      for (const item of order.items) {
        await supabase.rpc("decrease_stock", {
          product_id: item.product_id,
          quantity: item.quantity,
        })
      }
      return data
    }
  } catch (error) {
    console.log("Using mock data for creating order")
  }

  // Fallback to mock data
  return await mockDB.createOrder(order)
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase.from("orders").select("*").order("timestamp", { ascending: false })
      if (error) throw error
      return data || []
    }
  } catch (error) {
    console.log("Using mock data for orders")
  }

  // Fallback to mock data
  return await mockDB.getOrders()
}

export const updateOrderStatus = async (id: string, status: Order["status"]) => {
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single()
      if (error) throw error
      return data
    }
  } catch (error) {
    console.log("Using mock data for updating order status")
  }

  // Fallback to mock data
  return await mockDB.updateOrderStatus(id, status)
}

// Mock subscriptions for development
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  // In development, just call the callback immediately
  getProducts().then(callback)

  // Return a mock subscription
  return {
    unsubscribe: () => console.log("Unsubscribed from products"),
  }
}

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  // In development, just call the callback immediately
  getOrders().then(callback)

  // Return a mock subscription
  return {
    unsubscribe: () => console.log("Unsubscribed from orders"),
  }
}

// Export types
export type { Product, Order, OrderItem }
