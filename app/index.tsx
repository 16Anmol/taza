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
      <Image source={require("../assets/madikharidari.jpg")} style={styles.logo} />
      <Text style={styles.title}>MandiKharidari</Text>
      <Text style={styles.subtitle}>Hamara Apna Bazaar</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D97706",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
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