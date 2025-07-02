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
import { User, Phone, Lock, Eye, EyeOff, ArrowLeft, MapPin } from "lucide-react-native"

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleRegister = async () => {
    if (!formData.name || !formData.phone || !formData.password || !formData.address) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      await signUp(formData.phone, formData.password, formData.name, formData.address)
      router.replace("/(customer)")
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#22C55E" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us for fresh groceries</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#22C55E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={formData.name}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#22C55E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#94A3B8"
                value={formData.phone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MapPin size={20} color="#22C55E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Delivery Address"
                placeholderTextColor="#94A3B8"
                value={formData.address}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#22C55E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={formData.password}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#22C55E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm Password"
                placeholderTextColor="#94A3B8"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>{loading ? "Creating Account..." : "Create Account"}</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
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
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
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
    minHeight: 50,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 12,
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
  registerButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#64748B",
  },
  loginLink: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "600",
  },
})
