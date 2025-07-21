import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"

export default function Index() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("/(tabs)")
      } else {
        router.replace("/(auth)/login")
      }
    }
  }, [session, loading, router])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  )
}