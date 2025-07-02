// Mock data for development and testing

export interface Product {
  id: string
  name: string
  type: "fruit" | "vegetable"
  price: number
  stock: number
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  user_id: string
  location: string
  items: OrderItem[]
  total_cost: number
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
  timestamp: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  unit: string
}

// Mock products data
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Fresh Tomatoes",
    type: "vegetable",
    price: 40,
    stock: 50,
    image_url: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "2",
    name: "Green Spinach",
    type: "vegetable",
    price: 25,
    stock: 30,
    image_url: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "3",
    name: "Fresh Apples",
    type: "fruit",
    price: 120,
    stock: 25,
    image_url: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "4",
    name: "Bananas",
    type: "fruit",
    price: 60,
    stock: 40,
    image_url: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "5",
    name: "Carrots",
    type: "vegetable",
    price: 35,
    stock: 35,
    image_url: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "6",
    name: "Bell Peppers",
    type: "vegetable",
    price: 80,
    stock: 20,
    image_url: "/placeholder.svg?height=200&width=200",
  },
]

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: "order_1",
    user_id: "user_1",
    location: "123 Main St, City",
    items: [
      {
        product_id: "1",
        product_name: "Fresh Tomatoes",
        quantity: 2,
        price: 40,
        unit: "kg",
      },
    ],
    total_cost: 80,
    status: "pending",
    timestamp: new Date().toISOString(),
  },
]

// Simple in-memory storage for development
class MockDatabase {
  private products: Product[] = [...mockProducts]
  private orders: Order[] = [...mockOrders]

  // Product operations
  async getProducts(): Promise<Product[]> {
    return [...this.products]
  }

  async addProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.products.push(newProduct)
    return newProduct
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return null

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return this.products[index]
  }

  async deleteProduct(id: string): Promise<boolean> {
    const index = this.products.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.products.splice(index, 1)
    return true
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async createOrder(order: Omit<Order, "id" | "timestamp">): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    // Update product stock
    for (const item of order.items) {
      const product = this.products.find((p) => p.id === item.product_id)
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity)
      }
    }

    this.orders.push(newOrder)
    return newOrder
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
    const index = this.orders.findIndex((o) => o.id === id)
    if (index === -1) return null

    this.orders[index].status = status
    return this.orders[index]
  }
}

export const mockDB = new MockDatabase()
