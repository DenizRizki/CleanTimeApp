import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../config/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Perhatian", "Email dan password tidak boleh kosong!");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/login", {
        email: email.trim(),
        password: password,
      });

      setLoading(false);
      const { access_token, user } = response.data;

      await SecureStore.setItemAsync("user_token", access_token);
      await SecureStore.setItemAsync("user_name", user.name);

      router.replace("/(tabs)");
    } catch (error: any) {
      setLoading(false);
      const errorMsg =
        error.response?.data?.message ||
        "Gagal terhubung ke server. Pastikan server Laravel menyala.";
      Alert.alert("Login Gagal", errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding Header */}
          <View style={styles.headerArea}>
            <Text style={styles.brandTitle}>Clean Time</Text>
            <Text style={styles.brandTagline}>
              Eksklusif Laundry di Genggaman Anda
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>CUSTOMER PORTAL</Text>
            </View>
          </View>

          {/* Form Input */}
          <View style={styles.formArea}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Pelanggan</Text>
              <TextInput
                style={styles.input}
                placeholder="masukkan email Anda"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Tombol Submit */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>PERIKSA ORDERAN SAYA</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 28,
    justifyContent: "center",
  },
  headerArea: {
    marginBottom: 44,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "500",
  },
  badgeContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  formArea: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  button: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#64748b",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
  },
});
