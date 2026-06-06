import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../../config/api";

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
  payment_status: any;
  total_price: number;
  clothes_photo_url: string | null;
  items?: LaundryItem[];
}

const IP_LAPTOP = "10.0.2.2:8000";
const PORT_LARAVEL = "8000";

const formatRupiah = (value: number) => "Rp " + value?.toLocaleString("id-ID");

const getTimelineIndex = (status: string): number => {
  const s = status.toLowerCase();
  if (s.includes("cuci") || s.includes("dicuci")) return 1;
  if (s.includes("setrika") || s.includes("disetrika")) return 2;
  if (s.includes("siap")) return 3;
  if (s.includes("diambil") || s.includes("selesai")) return 4;
  return 0;
};

const COLORS = {
  brandBlue: "#1d4ed8",
  primary: "#0f172a",
  bg: "#f8fafc",
  card: "#ffffff",
  textMain: "#0f172a",
  textSub: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<LaundryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clothesUrl, setClothesUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // ── detail pesanan ──
  const fetchOrderDetail = useCallback(
    async (isRefreshCall = false) => {
      try {
        if (!isRefreshCall) setLoading(true);
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
          const found = (res.data.orders as LaundryOrder[]).find(
            (o) => String(o.id) === String(id),
          );

          if (found) {
            console.log("=========================================");
            console.log("INVOICE:", found.invoice_number);
            console.log("DATA payment_status ASLI:", found.payment_status);
            console.log(
              "TIPE DATA payment_status:",
              typeof found.payment_status,
            );
            console.log("=========================================");

            setOrder(found);
          }
        }
      } catch (e: any) {
        console.warn("Gagal mengambil detail:", e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetail(false);
    }, [fetchOrderDetail]),
  );

  useEffect(() => {
    if (order?.clothes_photo_url) {
      const filename =
        order.clothes_photo_url.trim().replace(/\\/g, "/").split("/").pop() ??
        "";
      const ts = Date.now();
      setClothesUrl(
        `http://${IP_LAPTOP}:${PORT_LARAVEL}/api/transactions/image/${filename}?t=${ts}`,
      );
    } else {
      setClothesUrl(null);
    }
  }, [order]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.brandBlue} />
        <Text style={s.loadingText}>Memuat detail nota…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.center}>
        <View style={s.notFoundIcon}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
        </View>
        <Text style={s.notFoundTitle}>Nota Tidak Ditemukan</Text>
        <Text style={s.notFoundSub}>Pesanan mungkin sudah dihapus.</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.btnBack}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={s.btnBackText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── KALKULASI STATUS ─────────────────────────────────────────────────────
  const currentStep = getTimelineIndex(order.status);
  const isFinished = currentStep === 4;
  const rawPayment = String(order.payment_status ?? "")
    .toLowerCase()
    .trim();
  const isPaid =
    rawPayment === "paid" ||
    rawPayment === "lunas" ||
    rawPayment === "settlement" ||
    rawPayment === "success" ||
    rawPayment === "1" ||
    order.payment_status === true ||
    order.payment_status === 1;

  const paymentLabel = isPaid ? "LUNAS" : "BELUM LUNAS";
  const paymentColor = isPaid ? "#10b981" : "#f59e0b";
  const paymentIcon = isPaid ? "checkmark-circle" : "time";

  const timelineSteps = [
    { label: "Antrian", icon: "receipt-outline" as const },
    { label: "Dicuci", icon: "water-outline" as const },
    { label: "Disetrika", icon: "flash-outline" as const },
    { label: "Siap", icon: "shirt-outline" as const },
    { label: "Selesai", icon: "checkmark-done-circle-outline" as const },
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textMain} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Detail Pesanan</Text>
          <Text style={s.headerInvoice}>{order.invoice_number}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrderDetail(true)}
            colors={[COLORS.brandBlue]}
          />
        }
      >
        {/* HERO CARD (Timeline & Status) */}
        <View style={[s.card, isFinished && s.heroCardDone]}>
          {isFinished && (
            <View style={s.doneBadge}>
              <Ionicons name="archive" size={12} color="#059669" />
              <Text style={s.doneBadgeText}>Masuk Riwayat</Text>
            </View>
          )}

          <Text style={s.sectionLabel}>PELACAKAN PESANAN</Text>

          {/* Timeline */}
          <View style={s.tlWrapper}>
            <View style={s.tlLineBg} />
            <View
              style={[
                s.tlLineActive,
                {
                  width: `${(currentStep / (timelineSteps.length - 1)) * 100}%`,
                },
              ]}
            />

            {timelineSteps.map((step, idx) => {
              const active = idx <= currentStep;
              return (
                <View key={idx} style={s.tlItem}>
                  <View style={[s.tlDot, active ? s.tlDotActive : s.tlDotIdle]}>
                    <Ionicons
                      name={step.icon}
                      size={14}
                      color={active ? "#fff" : COLORS.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      s.tlLabel,
                      active ? s.tlLabelActive : s.tlLabelIdle,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={s.divider} />

          {/* Status pembayaran */}
          <Text style={s.sectionLabel}>STATUS PEMBAYARAN</Text>
          <View style={s.payRow}>
            <View
              style={[
                s.payIconWrap,
                { backgroundColor: isPaid ? "#d1fae5" : "#fef3c7" },
              ]}
            >
              <Ionicons name={paymentIcon} size={18} color={paymentColor} />
            </View>
            <Text style={[s.payLabel, { color: paymentColor }]}>
              {paymentLabel}
            </Text>
            {isPaid && (
              <View style={s.paidBadge}>
                <Text style={s.paidBadgeText}>Terverifikasi</Text>
              </View>
            )}
          </View>
        </View>

        {/* DAFTAR LAYANAN */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="list-outline" size={16} color={COLORS.textSub} />
            <Text style={s.cardTitle}>RINCIAN LAYANAN</Text>
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <View
                key={idx}
                style={[
                  s.itemRow,
                  idx < order.items!.length - 1 && s.itemRowBorder,
                ]}
              >
                <View style={s.itemLeft}>
                  <View style={s.itemBullet} />
                  <Text style={s.itemName}>{item.service_name}</Text>
                </View>
                <View style={s.itemRight}>
                  <Text style={s.itemQty}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={s.itemSubtotal}>
                    {formatRupiah(item.subtotal)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyBox}>
              <Ionicons name="cube-outline" size={28} color={COLORS.border} />
              <Text style={s.emptyText}>Tidak ada rincian layanan.</Text>
            </View>
          )}

          <View style={s.totalBox}>
            <Text style={s.totalLabel}>Total Tagihan</Text>
            <Text style={s.totalValue}>{formatRupiah(order.total_price)}</Text>
          </View>
        </View>

        {/* FOTO KONDISI PAKAIAN */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="camera-outline" size={16} color={COLORS.textSub} />
            <Text style={s.cardTitle}>FOTO KONDISI PAKAIAN</Text>
          </View>

          {clothesUrl ? (
            <View style={s.imgWrapper}>
              <ExpoImage
                source={{ uri: clothesUrl }}
                style={s.clothesImg}
                contentFit="cover"
                transition={300}
                cachePolicy="none"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(err) => console.warn("Image error:", err.error)}
              />
              {imageLoading && (
                <View style={s.imgLoader}>
                  <ActivityIndicator size="large" color={COLORS.brandBlue} />
                </View>
              )}
              <View style={s.imgOverlay}>
                <Ionicons name="expand-outline" size={16} color="#fff" />
                <Text style={s.imgOverlayText}>Foto dari kasir</Text>
              </View>
            </View>
          ) : (
            <View style={s.noImgBox}>
              <Ionicons name="image-outline" size={36} color="#cbd5e1" />
              <Text style={s.noImgText}>Foto belum tersedia</Text>
              <Text style={s.noImgSub}>
                Kasir belum mengunggah foto pakaian
              </Text>
            </View>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLESHEET ───
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: "500",
  },

  // NOT FOUND STATE
  notFoundIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notFoundTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 6,
  },
  notFoundSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnBackText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // HEADER BAR
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  headerInvoice: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: "500",
    marginTop: 1,
  },

  scroll: {
    padding: 16,
    gap: 14,
  },

  // MODERN PREMIUM CARD
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  heroCardDone: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  doneBadgeText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSub,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 20,
  },

  // TIMELINE TRACKING
  tlWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    paddingHorizontal: 4,
  },
  tlLineBg: {
    position: "absolute",
    top: 15,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: COLORS.borderLight,
  },
  tlLineActive: {
    position: "absolute",
    top: 15,
    left: 16,
    height: 2,
    backgroundColor: COLORS.brandBlue,
  },
  tlItem: {
    alignItems: "center",
    width: 56,
  },
  tlDot: {
    width: 32,
    height: 32,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 10,
  },
  tlDotActive: {
    backgroundColor: COLORS.brandBlue,
  },
  tlDotIdle: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tlLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  tlLabelActive: {
    color: COLORS.brandBlue,
    fontWeight: "600",
  },
  tlLabelIdle: {
    color: COLORS.textMuted,
  },

  // STATUS PEMBAYARAN
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  payLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  paidBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: "auto",
  },
  paidBadgeText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
  },

  // SERVICE ITEM DETAILS
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSub,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // TOTAL SUMMARY BOX
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSub,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // LAUNDRY IMAGE DOCUMENTATION
  imgWrapper: {
    position: "relative",
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.bg,
  },
  clothesImg: {
    width: "100%",
    height: "100%",
  },
  imgLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  imgOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imgOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },

  noImgBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 14,
    gap: 4,
    backgroundColor: COLORS.bg,
  },
  noImgText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSub,
  },
  noImgSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
