import React, { createContext, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error("Failed to check auth state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (phone, password) => {
    try {
      // Simple validation - in production, validate against your backend
      if (phone.length < 10 || password.length < 4) {
        throw new Error("Invalid phone number or password")
      }

      // Mock user data - replace with actual API call
      const userData = {
        id: phone,
        name: "Customer User",
        phone: phone,
        email: `${phone}@taazabazaar.com`,
        address: "Sample Address, City, State",
        role: "customer",
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      throw new Error(error.message || "Invalid phone number or password")
    }
  }

  const signUp = async (phone, password, name, address) => {
    try {
      if (phone.length < 10 || password.length < 4 || !name.trim() || !address.trim()) {
        throw new Error("Please fill all fields correctly")
      }

      const userData = {
        id: phone,
        name: name.trim(),
        phone: phone,
        email: `${phone}@taazabazaar.com`,
        address: address.trim(),
        role: "customer",
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      throw new Error(error.message || "Failed to create account")
    }
  }

  const signInAdmin = async (username, password) => {
    // Static admin credentials as per requirements
    if (username === "anmol" && password === "1234") {
      const adminData = {
        id: "admin",
        name: "Admin User",
        phone: "9876543210",
        address: "Admin Office, TaazaBazaar HQ",
        role: "admin",
      }

      await AsyncStorage.setItem("userData", JSON.stringify(adminData))
      setUser(adminData)
    } else {
      throw new Error("Invalid admin credentials")
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userData")
      setUser(null)
    } catch (error) {
      throw new Error("Failed to logout")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}