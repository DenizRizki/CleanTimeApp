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
// Import Ionicons untuk fitur Unhide Password
import { Ionicons } from "@expo/vector-icons";
import API from "../config/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // State baru untuk menyembunyikan/menampilkan password
  const [secureText, setSecureText] = useState<boolean>(true);

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
      {/* Background Decorator Ornamen Estetik */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding Header dengan Logo 'C' */}
          <View style={styles.headerArea}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>C</Text>
              {/* Efek aksen gelembung laundry di logo */}
              <View style={styles.logoBubble} />
            </View>

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
            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Pelanggan</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
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
            </View>

            {/* Input Password + Fitur Unhide */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                />
                {/* Tombol Mata / Toggle Unhide */}
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setSecureText(!secureText)}
                >
                  <Ionicons
                    name={secureText ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#f8fafc", // Mengubah base ke abu-abu super soft premium
  },
  // Ornamen background lingkaran estetik ala aplikasi modern
  bgCircleTop: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#e2e8f0",
    opacity: 0.4,
  },
  bgCircleBottom: {
    position: "absolute",
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#cbd5e1",
    opacity: 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 28,
    justifyContent: "center",
  },
  headerArea: {
    marginBottom: 36,
    alignItems: "center", // Ratatengah agar logo & judul sinkron mewah
  },
  // Style Box Logo C Modern
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    position: "relative",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    fontFamily:
      Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-condensed",
  },
  logoBubble: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38bdf8", // Aksen warna biru laundry cerah
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandTagline: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  badgeContainer: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 1,
  },
  formArea: {
    gap: 18,
    backgroundColor: "#ffffff", // Form dibungkus card putih bersih
    padding: 24,
    borderRadius: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  // Container baru untuk input + icon di dalamnya
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingLeft: 46, // Space di kiri untuk meletakkan icon internal
    paddingRight: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
