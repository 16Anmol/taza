import { Stack } from "expo-router"
import { AuthProvider } from "../contexts/AuthContext"
import { CartProvider } from "../contexts/CartContext"

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  )
}
