import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ocmscvjlohoipculwstf.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbXNjdmpsb2hvaXBjdWx3c3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDgwNDQsImV4cCI6MjA2ODQyNDA0NH0.eR7lilI2I05rYQqK-zef0DoC9BsbGvR_VqRppkPt1Y8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  mandi_id: string
  name: string
  category: "fruits" | "vegetables" | "others"
  price: number
  stock_status: "in_stock" | "out_of_stock"
  image_url: string | null
  created_at: string
  updated_at: string
}

export type RateHistory = {
  id: string
  product_id: string
  mandi_id: string
  old_price: number
  new_price: number
  updated_at: string
  products: {
    name: string
  }
}

export type User = {
  id: string
  mandi_id: string
  mandi_name: string
  created_at: string
}
