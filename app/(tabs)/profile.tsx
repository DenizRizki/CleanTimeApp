import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../config/api";

export default function ProfileScreen() {
  const router = useRouter();

  // State data asli dari database
  const [currentName, setCurrentName] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  // State hidup untuk TextInput (Di-kosongkan agar placeholder aslinya kelihatan)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // Fungsi mengambil data langsung dari database Laravel
  const loadUserData = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("user_token");

      const res = await API.get("/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const userData = res.data.user || res.data;

      if (userData) {
        const dbName = userData.name || "";
        const dbEmail = userData.email || "";
        const dbPhone = userData.phone || "";

        setCurrentName(dbName);
        setCurrentEmail(dbEmail);
        setCurrentPhone(dbPhone);

        setName("");
        setPhone("");

        await SecureStore.setItemAsync("user_name", dbName);
        await SecureStore.setItemAsync("user_email", dbEmail);
        await SecureStore.setItemAsync("user_phone", dbPhone);
      }
    } catch (error: any) {
      console.log("Gagal ambil data dari API, gunakan fallback lokal:", error);
      const savedName = (await SecureStore.getItemAsync("user_name")) || "";
      const savedEmail = (await SecureStore.getItemAsync("user_email")) || "";
      const savedPhone = (await SecureStore.getItemAsync("user_phone")) || "";

      setCurrentName(savedName);
      setCurrentEmail(savedEmail);
      setCurrentPhone(savedPhone);

      setName("");
      setPhone("");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, []),
  );

  const handleUpdateProfile = async () => {
    const payload: any = {};

    // 1. Validasi Nama Lengkap
    if (name.trim() !== "" && name.trim() !== currentName) {
      if (name.trim().length < 3) {
        Alert.alert("Gagal", "Nama lengkap minimal harus 3 karakter.");
        return;
      }
      payload.name = name.trim();
    }

    // 2. Validasi Nomor Telepon
    if (phone.trim() !== "" && phone.trim() !== currentPhone) {
      // RegEx untuk mengecek apakah input murni angka saja
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(phone.trim())) {
        Alert.alert("Gagal", "Nomor telepon hanya boleh berisi angka.");
        return;
      }

      if (phone.trim().length < 10 || phone.trim().length > 13) {
        Alert.alert(
          "Gagal",
          "Nomor telepon harus bernilai antara 10 sampai 13 digit.",
        );
        return;
      }
      payload.phone = phone.trim();
    }

    // 3. Validasi Password
    if (password.trim().length > 0) {
      if (password.trim().length < 6) {
        Alert.alert("Gagal", "Password baru minimal harus 6 karakter.");
        return;
      }
      payload.password = password.trim();
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert("Info", "Tidak ada data profil baru yang Anda ketikkan.");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("user_token");

      const res = await API.post("/update-profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data?.status === "success") {
        if (payload.name)
          await SecureStore.setItemAsync("user_name", payload.name);
        if (payload.phone)
          await SecureStore.setItemAsync("user_phone", payload.phone);

        if (payload.name) setCurrentName(payload.name);
        if (payload.phone) setCurrentPhone(payload.phone);

        setName("");
        setPhone("");
        setPassword("");

        Alert.alert("Berhasil", "Perubahan profil berhasil disimpan.");
      }
    } catch (error: any) {
      Alert.alert(
        "Oops!",
        error.response?.data?.message || "Gagal memperbarui profil ke server.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Yakin ingin keluar dari aplikasi?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("user_token");
            await SecureStore.deleteItemAsync("user_name");
            await SecureStore.deleteItemAsync("user_email");
            await SecureStore.deleteItemAsync("user_phone");
            router.replace("/login");
          } catch (e) {
            console.log("Error saat logout:", e);
            Alert.alert("Error", "Gagal menghapus sesi login.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>Profil Saya</Text>

          {/* AVATAR DISPLAY CARD */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBlock}>
              <Text style={styles.avatarText}>
                {currentName ? currentName.charAt(0).toUpperCase() : "P"}
              </Text>
            </View>
            <Text style={styles.currentUserName}>
              {currentName || "Pelanggan"}
            </Text>
            <Text style={styles.avatarSubText}>Hak Akses Pelanggan</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.cardForm}>
            {/* EMAIL (DARI DB - READ ONLY DAN TIDAK PAKAI PLACEHOLDER KARENA FIX) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Alamat Email (Tidak Dapat Diubah)
              </Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={[styles.input, { color: "#94a3b8" }]}
                  value={currentEmail}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color="#cbd5e1" />
              </View>
            </View>

            {/* NAMA LENGKAP */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={currentName || "Masukkan nama baru"}
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* NOMOR TELEPON */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor Telepon</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder={currentPhone || "Belum ada nomor telepon aktif"}
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Baru (Opsional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons
                    name={secureText ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* BTN SAVE */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Keluar Akun</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>CleanTime Mobile v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  avatarBlock: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  currentUserName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  avatarSubText: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  cardForm: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputDisabled: { backgroundColor: "#e2e8f0", borderColor: "#cbd5e1" },
  input: { flex: 1, fontSize: 14, color: "#334155", fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    height: 48,
    gap: 8,
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    height: 48,
    gap: 8,
    marginTop: 20,
  },
  logoutBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "700" },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 32,
  },
});
