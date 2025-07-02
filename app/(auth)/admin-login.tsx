"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native"
import { router } from "expo-router"
import { useAuth } from "../../contexts/AuthContext"
import { User, Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react-native"

export default function AdminLoginScreen() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signInAdmin } = useAuth()

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await signInAdmin(username, password)
      router.replace("/(admin)")
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#3B82F6" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={40} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage TaazaBazaar operations</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#3B82F6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#94A3B8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#3B82F6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>{loading ? "Signing In..." : "Admin Sign In"}</Text>
            </TouchableOpacity>

            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Credentials</Text>
              <Text style={styles.demoText}>Username: anmol</Text>
              <Text style={styles.demoText}>Password: 1234</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1E293B",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    height: 50,
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 2,
  },
})
