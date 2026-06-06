import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import OrderCard, { LaundryOrder } from "../../components/OrderCard";
import API from "../../config/api";

// ── Feedback berubah ───────────────────────────────────────────
function triggerStatusChangeFeedback() {
  if (Platform.OS === "android") {
    Vibration.vibrate([0, 100, 80, 200]);
  } else {
    Vibration.vibrate(200);
  }
}

// ── In-app toast popup ────────────────────────────────────────────────────────
interface ToastItem {
  id: string;
  invoice: string;
  oldStatus: string;
  newStatus: string;
}

const StatusToast = ({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(onClose);
    }, 4000);

    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.toastIconWrap}>
        <Ionicons name="notifications-outline" size={18} color="#10b981" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toastTitle}>Update Status Cucian</Text>
        <Text style={styles.toastBody} numberOfLines={2}>
          <Text style={{ fontWeight: "800" }}>{item.invoice}</Text> berganti
          dari{" "}
          <Text style={{ fontWeight: "700", color: "#f59e0b" }}>
            {item.oldStatus}
          </Text>
          {" → "}
          <Text style={{ fontWeight: "700", color: "#10b981" }}>
            {item.newStatus}
          </Text>
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
        <Ionicons name="close" size={16} color="#94a3b8" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();

  const [activeOrders, setActiveOrders] = useState<LaundryOrder[]>([]);
  const [customerName, setCustomerName] = useState("Pelanggan");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifModal, setNotifModal] = useState(false);
  const [notifHistory, setNotifHistory] = useState<ToastItem[]>([]);
  const [stats, setStats] = useState({ active: 0, ready: 0, unpaid: 0 });

  const prevStatusRef = useRef<{ [id: string]: string }>({});

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const fetchMyOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync("user_token");
      const savedName = await SecureStore.getItemAsync("user_name");

      if (savedName) setCustomerName(savedName);

      if (!token) {
        setErrorMessage("Sesi berakhir.");
        return;
      }

      const res = await API.get("/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data?.status === "success") {
        const fetched: LaundryOrder[] = res.data.orders || [];

        // ================================
        //  LOGIKA HITUNGAN BARU
        // ================================

        // 1. Diproses
        const countActive = fetched.filter((o) => {
          if (!o.status) return false;
          const s = String(o.status).toLowerCase().trim();
          const isSiap = s.includes("siap");
          const isSelesai =
            s.includes("selesai") ||
            (s.includes("ambil") && !s.includes("siap"));
          return !isSiap && !isSelesai;
        }).length;

        // 2. Siap Ambil
        const countReady = fetched.filter((o) => {
          if (!o.status) return false;
          const s = String(o.status).toLowerCase().trim();
          return s.includes("siap");
        }).length;

        // 3. Belum Bayar
        const countUnpaid = fetched.filter((o) => {
          const payment = o.payment_status
            ? String(o.payment_status).toLowerCase().trim()
            : "";
          const isUnpaid =
            payment === "pending" ||
            payment === "unpaid" ||
            payment === "belum bayar" ||
            payment === "0" ||
            payment === "false" ||
            payment === "" ||
            payment === "null";

          return isUnpaid;
        }).length;

        setStats({
          active: countActive,
          ready: countReady,
          unpaid: countUnpaid,
        });

        // ================================
        // FILTER PROGRESS DASHBOARD
        // ================================
        const remaining = fetched.filter((o) => {
          if (!o.status) return false;
          const s = String(o.status).toLowerCase().trim();
          const payment = o.payment_status
            ? String(o.payment_status).toLowerCase().trim()
            : "";

          const isBeres =
            s.includes("selesai") ||
            (s.includes("ambil") && !s.includes("siap"));
          const isUnpaid =
            payment === "pending" ||
            payment === "unpaid" ||
            payment === "belum bayar" ||
            payment === "0" ||
            payment === "false" ||
            payment === "" ||
            payment === "null";
          return !isBeres || isUnpaid;
        });

        setActiveOrders(remaining);
        setErrorMessage(null);

        // ================================
        // DETEKSI PERUBAHAN STATUS
        // ================================
        if (Object.keys(prevStatusRef.current).length > 0) {
          fetched.forEach((o) => {
            const old = prevStatusRef.current[String(o.id)];
            if (
              old &&
              o.status &&
              old.toLowerCase() !== o.status.toLowerCase()
            ) {
              const toast: ToastItem = {
                id: String(o.id) + Date.now(),
                invoice: o.invoice_number || (o as any).invoice_code || "TRX",
                oldStatus: old,
                newStatus: o.status,
              };
              setToasts((prev) => [...prev, toast]);
              setNotifHistory((prev) => [toast, ...prev].slice(0, 20));
              triggerStatusChangeFeedback();
            }
          });
        }

        // SAVE STATUS SEBELUMNYA
        const curr: { [id: string]: string } = {};
        fetched.forEach((o) => {
          if (o.status) curr[String(o.id)] = o.status;
        });
        prevStatusRef.current = curr;
      }
    } catch (e: any) {
      setErrorMessage(
        e.response?.data?.message || "Tidak dapat terhubung ke server.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyOrders();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyOrders();
  }, []);

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Greeting dinamis ─────────────────────────────────────────────────────
  const hour = new Date().getHours();
  let greeting = "Selamat Malam";
  let greetIcon: keyof typeof Ionicons.glyphMap = "moon-outline";
  let iconColor = "#38bdf8";

  if (hour >= 5 && hour < 11) {
    greeting = "Selamat Pagi";
    greetIcon = "sunny-outline";
    iconColor = "#ea580c";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat Siang";
    greetIcon = "partly-sunny-outline";
    iconColor = "#eab308";
  } else if (hour >= 15 && hour < 18) {
    greeting = "Selamat Sore";
    greetIcon = "cloudy-night-outline";
    iconColor = "#f97316";
  }

  const displayName = customerName
    .split(" ")[0]
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={{ paddingTop: 8 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
      <View style={styles.greetingCard}>
        <View style={styles.greetingAvatar}>
          <Text style={styles.greetingAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.greetingInfo}>
          <View style={styles.greetingSubBlock}>
            <Ionicons
              name={greetIcon}
              size={14}
              color={iconColor}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.greetingSub}>{greeting}</Text>
          </View>
          <Text style={styles.greetingName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setNotifModal(true)}
          style={styles.notifBtn}
        >
          <Ionicons name="notifications-outline" size={20} color="#334155" />
          {notifHistory.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {notifHistory.length > 9 ? "9+" : notifHistory.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryDecor1} />
        <View style={styles.summaryDecor2} />

        <Text style={styles.summaryTitle}>Ringkasan Cucian Anda</Text>

        <View style={styles.summaryRow}>
          {/* Diproses */}
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryNum, { color: "#f59e0b" }]}>
              {stats.active}
            </Text>
            <View style={[styles.summaryChip, { backgroundColor: "#451a03" }]}>
              <Ionicons name="time-outline" size={10} color="#f59e0b" />
              <Text style={[styles.summaryChipText, { color: "#f59e0b" }]}>
                Diproses
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Siap Ambil */}
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryNum, { color: "#10b981" }]}>
              {stats.ready}
            </Text>
            <View style={[styles.summaryChip, { backgroundColor: "#022c22" }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={10}
                color="#10b981"
              />
              <Text style={[styles.summaryChipText, { color: "#10b981" }]}>
                Siap Ambil
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Belum Bayar */}
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryNum, { color: "#f87171" }]}>
              {stats.unpaid}
            </Text>
            <View style={[styles.summaryChip, { backgroundColor: "#450a0a" }]}>
              <Ionicons name="card-outline" size={10} color="#f87171" />
              <Text style={[styles.summaryChipText, { color: "#f87171" }]}>
                Blm Bayar
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.listHeading}>Progress Cucian Aktif</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Ionicons name="basket-outline" size={44} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>Tidak ada cucian aktif</Text>
      <Text style={styles.emptyBody}>
        Semua transaksi selesai, atau silakan bawa cucian baru Anda ke outlet
        kami.
      </Text>
    </View>
  );

  // ── Loading & error states ────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <Ionicons name="water-outline" size={36} color="#0f172a" />
        <Text
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "#94a3b8",
            fontWeight: "600",
          }}
        >
          Memuat data cucian...
        </Text>
      </View>
    );
  }

  if (errorMessage && activeOrders.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={44} color="#ef4444" />
        </View>
        <Text style={styles.errorTitle}>Koneksi Terputus</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetchMyOrders();
          }}
        >
          <Ionicons name="refresh-outline" size={14} color="#fff" />
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((t) => (
          <StatusToast key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={(item, i) => (item?.id ? String(item.id) : String(i))}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/(tabs)/order/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0f172a"]}
            tintColor="#0f172a"
          />
        }
      />

      <Modal
        visible={notifModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Riwayat Notifikasi</Text>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {notifHistory.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color="#cbd5e1"
                />
                <Text style={styles.modalEmptyText}>Belum ada notifikasi</Text>
              </View>
            ) : (
              notifHistory.map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <View style={styles.notifItemIcon}>
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={14}
                      color="#10b981"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifItemInvoice}>{n.invoice}</Text>
                    <Text style={styles.notifItemStatus}>
                      {n.oldStatus}{" "}
                      <Text style={{ color: "#10b981" }}>→ {n.newStatus}</Text>
                    </Text>
                  </View>
                </View>
              ))
            )}

            {notifHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => setNotifHistory([])}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Hapus Semua Riwayat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 32,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 44, paddingTop: 10 },

  // Toast
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
    elevation: 8,
  },
  toastIconWrap: { backgroundColor: "#022c22", padding: 8, borderRadius: 10 },
  toastTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  toastBody: { fontSize: 11, color: "#94a3b8", lineHeight: 15 },

  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  greetingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  greetingAvatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  greetingInfo: { flex: 1 },
  greetingSubBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  greetingSub: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  greetingName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  // Notif button
  notifBtn: {
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  notifBadgeText: { fontSize: 8, fontWeight: "900", color: "#fff" },

  // Summary card
  summaryCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
  },
  summaryDecor1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#1e293b",
    top: -60,
    right: -40,
  },
  summaryDecor2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10b981",
    bottom: -40,
    left: -20,
    opacity: 0.1,
  },
  summaryTitle: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryCol: { alignItems: "center", flex: 1, gap: 8 },
  summaryNum: { fontSize: 38, fontWeight: "900", letterSpacing: -1 },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  summaryChipText: { fontSize: 10, fontWeight: "700" },
  summaryDivider: { width: 1, height: 48, backgroundColor: "#1e293b" },

  listHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  // Empty
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 10,
  },
  emptyIcon: {
    backgroundColor: "#e2e8f0",
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569" },
  emptyBody: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },

  // Error
  errorIcon: {
    backgroundColor: "#fee2e2",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
  },
  errorBody: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "75%",
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  modalEmpty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  modalEmptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  notifItemIcon: {
    backgroundColor: "#dcfce7",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  notifItemInvoice: { fontSize: 12, fontWeight: "800", color: "#1e293b" },
  notifItemStatus: { fontSize: 11, color: "#64748b", marginTop: 2 },
  clearBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  clearBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
});
