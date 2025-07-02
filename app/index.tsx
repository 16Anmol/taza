"use client"

import { useEffect } from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { router } from "expo-router"
import { useAuth } from "../contexts/AuthContext"

export default function SplashScreen() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (user) {
          if (user.role === "admin") {
            router.replace("/(admin)")
          } else {
            router.replace("/(customer)")
          }
        } else {
          router.replace("/(auth)/welcome")
        }
      }, 2000)
    }
  }, [user, isLoading])

  return (
    <View style={styles.container}>
      <Image source={{ uri: "/placeholder.svg?height=120&width=120" }} style={styles.logo} />
      <Text style={styles.title}>TaazaBazaar</Text>
      <Text style={styles.subtitle}>Fresh • Fast • Delivered</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22C55E",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
})
