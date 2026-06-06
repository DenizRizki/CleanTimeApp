import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import API from "../../config/api";

interface LaundryItem {
  service_name: string;
  quantity: number;
  unit: string;
  subtotal: number;
}

interface LaundryOrder {
  id: number;
  invoice_number: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  items?: LaundryItem[];
}

export default function ExploreHistoryScreen() {
  const router = useRouter();

  const [historyOrders, setHistoryOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistoryOrders = async (isRefreshingCall = false) => {
    try {
      if (!isRefreshingCall) setLoading(true);
      else setRefreshing(true);

      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        router.replace("/");
        return;
      }

      const res = await API.get("/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data?.status === "success") {
        const allOrders = res.data.orders as LaundryOrder[];
        const filtered = allOrders.filter((o) => {
          if (!o.status) return false;
          const s = o.status.toLowerCase().trim();

          // Memastikan hanya menampilkan data yang sudah diambil atau selesai
          return s.includes("ambil") || s.includes("selesai");
        });

        setHistoryOrders(filtered);
      }
    } catch (e: any) {
      console.warn("Gagal memuat riwayat:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistoryOrders(false);
    }, []),
  );

  const renderHistoryItem = ({ item }: { item: LaundryOrder }) => {
    const orderPaymentStatus = item.payment_status
      ? item.payment_status.toLowerCase().trim()
      : "";
    const isLunas = orderPaymentStatus === "lunas";

    return (
      // Menggunakan View biasa agar kartu bersifat statis dan tidak bisa ditekan
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.invoiceWrapper}>
            <Ionicons name="receipt" size={16} color="#0f172a" />
            <Text style={s.invoiceText}>{item.invoice_number}</Text>
          </View>
          <View style={s.historyBadge}>
            <Text style={s.historyBadgeText}>Sudah Diambil</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* List Layanan */}
        <Text style={s.sectionLabel}>Layanan yang digunakan:</Text>
        <View style={s.serviceContainer}>
          {item.items && item.items.length > 0 ? (
            item.items.map((srv, idx) => (
              <View key={idx} style={s.serviceRow}>
                <View style={s.serviceLeft}>
                  <Ionicons name="shirt-outline" size={14} color="#475569" />
                  <Text style={s.serviceName}>{srv.service_name}</Text>
                </View>
                <Text style={s.serviceQty}>
                  {srv.quantity} {srv.unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={s.emptyServiceText}>Tidak ada detail layanan.</Text>
          )}
        </View>

        <View style={s.divider} />

        {/* Total Bayar & Status Pembayaran */}
        <View style={s.cardFooter}>
          <View>
            <Text style={s.totalLabel}>Total Bayar</Text>
            <Text style={s.totalPrice}>
              Rp {item.total_price?.toLocaleString("id-ID")}
            </Text>
          </View>

          <View style={[s.paymentBadge, isLunas ? s.badgeLunas : s.badgeBelum]}>
            <Ionicons
              name={isLunas ? "checkmark-circle" : "alert-circle"}
              size={12}
              color={isLunas ? "#0369a1" : "#b45309"}
            />
            <Text
              style={[s.paymentBadgeText, isLunas ? s.textLunas : s.textBelum]}
            >
              {item.payment_status?.toUpperCase() ?? "PENDING"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* HEADER SCREEN */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Riwayat Transaksi</Text>
        <Text style={s.headerSubtitle}>
          Daftar pesanan laundry yang telah selesai diambil
        </Text>
      </View>

      {/* MAIN CONTENT */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={s.loadingText}>Memuat riwayat...</Text>
        </View>
      ) : historyOrders.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistoryOrders(true)}
            />
          }
          ListEmptyComponent={
            <View style={s.centerEmpty}>
              <Ionicons name="archive-outline" size={44} color="#94a3b8" />
              <Text style={s.emptyTitle}>Belum Ada Riwayat</Text>
              <Text style={s.emptySubtitle}>
                Nota yang pakaiannya sudah diambil pelanggan akan otomatis
                diarsipkan di sini.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={historyOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderHistoryItem}
          contentContainerStyle={s.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistoryOrders(true)}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  headerSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#64748b", fontSize: 13 },

  centerEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },

  listContainer: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceWrapper: { flexDirection: "row", alignItems: "center", gap: 6 },
  invoiceText: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  historyBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: { fontSize: 10, fontWeight: "800", color: "#069669" },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serviceContainer: { gap: 6 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
  },
  serviceLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  serviceName: { fontSize: 13, fontWeight: "600", color: "#334155" },
  serviceQty: { fontSize: 13, fontWeight: "700", color: "#475569" },
  emptyServiceText: { fontSize: 12, color: "#cbd5e1", fontStyle: "italic" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  totalPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10b981",
    marginTop: 1,
  },

  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeLunas: { backgroundColor: "#e0f2fe" },
  badgeBelum: { backgroundColor: "#fef3c7" },
  paymentBadgeText: { fontSize: 11, fontWeight: "800" },
  textLunas: { color: "#0369a1" },
  textBelum: { color: "#b45309" },
});
