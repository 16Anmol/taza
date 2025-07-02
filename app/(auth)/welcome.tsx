import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from "react-native"
import { router } from "expo-router"
import { Leaf, ShoppingBag, Users } from "lucide-react-native"

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={{ uri: "/placeholder.svg?height=200&width=200" }} style={styles.heroImage} />

        <Text style={styles.title}>Welcome to TaazaBazaar</Text>
        <Text style={styles.subtitle}>Fresh vegetables and fruits delivered to your doorstep</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Leaf size={24} color="#22C55E" />
            <Text style={styles.featureText}>Fresh & Organic</Text>
          </View>
          <View style={styles.feature}>
            <ShoppingBag size={24} color="#22C55E" />
            <Text style={styles.featureText}>Easy Ordering</Text>
          </View>
          <View style={styles.feature}>
            <Users size={24} color="#22C55E" />
            <Text style={styles.featureText}>Trusted by Thousands</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.customerButton} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.customerButtonText}>Shop as Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButton} onPress={() => router.push("/(auth)/admin-login")}>
            <Text style={styles.adminButtonText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 60,
  },
  feature: {
    alignItems: "center",
  },
  featureText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
  customerButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  customerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  adminButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
})
