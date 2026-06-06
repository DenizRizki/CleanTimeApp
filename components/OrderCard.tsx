import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ── Types

export interface OrderItem {
  service_name: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface LaundryOrder {
  id: string | number;
  invoice_number: string;
  status: string;
  service_name?: string;
  weight_or_unit?: string;
  clothes_photo_url?: string;
  transfer_proof_url?: string;
  items?: OrderItem[];
  total_price?: number;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
}

interface OrderCardProps {
  order: LaundryOrder;
  onPress?: () => void;
}

// ── Status config

const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();

  if (s.includes("antrian") || s.includes("pending")) {
    return {
      bg: "#fff7ed",
      border: "#fed7aa",
      text: "#c2410c",
      dot: "#f97316",
      icon: "time-outline" as const,
      label: "Antrian",
    };
  }
  if (s.includes("cuci") || s.includes("proses")) {
    return {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      dot: "#3b82f6",
      icon: "water-outline" as const,
      label: "Dicuci",
    };
  }
  if (s.includes("setrika") || s.includes("iron")) {
    return {
      bg: "#faf5ff",
      border: "#e9d5ff",
      text: "#7c3aed",
      dot: "#a855f7",
      icon: "shirt-outline" as const,
      label: "Disetrika",
    };
  }
  if (s.includes("siap") || s.includes("ready")) {
    return {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
      dot: "#22c55e",
      icon: "checkmark-circle-outline" as const,
      label: "Siap Ambil",
    };
  }
  if (
    s.includes("sudah diambil") ||
    s.includes("done") ||
    s.includes("diambil")
  ) {
    return {
      bg: "#f8fafc",
      border: "#e2e8f0",
      text: "#475569",
      dot: "#94a3b8",
      icon: "checkmark-done-outline" as const,
      label: "Selesai",
    };
  }

  return {
    bg: "#f8fafc",
    border: "#e2e8f0",
    text: "#475569",
    dot: "#94a3b8",
    icon: "ellipse-outline" as const,
    label: status,
  };
};

// ── Payment badge

const PaymentBadge = ({ status }: { status?: string }) => {
  const isPaid = status?.toLowerCase() === "lunas";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: isPaid ? "#f0fdf4" : "#fefce8",
        borderWidth: 1,
        borderColor: isPaid ? "#bbf7d0" : "#fde68a",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: isPaid ? "#22c55e" : "#eab308",
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: isPaid ? "#15803d" : "#a16207",
        }}
      >
        {status ?? "Pending"}
      </Text>
    </View>
  );
};

// ── Main Component

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status);
  const hasMultipleItems = (order.items?.length ?? 0) > 1;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#94a3b8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: statusConfig.dot,
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
        }}
      />

      <View style={{ padding: 16, paddingLeft: 20 }}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#f8fafc",
                padding: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Ionicons name="receipt-outline" size={13} color="#64748b" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "#334155",
                  letterSpacing: 0.3,
                }}
              >
                {order.invoice_number}
              </Text>
              {order.created_at && (
                <Text
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    fontWeight: "500",
                    marginTop: 1,
                  }}
                >
                  {order.created_at}
                </Text>
              )}
            </View>
          </View>

          {/* Status badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: statusConfig.bg,
              borderWidth: 1,
              borderColor: statusConfig.border,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: statusConfig.dot,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: statusConfig.text,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 10,
              color: "#94a3b8",
              fontWeight: "600",
              marginBottom: 3,
            }}
          >
            PAKET LAYANAN
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#1e293b",
              lineHeight: 20,
            }}
            numberOfLines={1}
          >
            {order.service_name || "Layanan Laundry"}
          </Text>

          {/* Multi-item indicator */}
          {hasMultipleItems && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 5,
              }}
            >
              {order.items?.slice(0, 3).map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Text
                    style={{ fontSize: 9, color: "#64748b", fontWeight: "600" }}
                  >
                    {item.service_name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Kiri */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#f8fafc",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Ionicons name="scale-outline" size={11} color="#64748b" />
              <Text
                style={{ fontSize: 10, color: "#475569", fontWeight: "700" }}
              >
                {order.weight_or_unit || "0 Kg"}
              </Text>
            </View>

            {order.payment_status && (
              <PaymentBadge status={order.payment_status} />
            )}
          </View>

          {/* Kanan */}
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 9,
                color: "#94a3b8",
                fontWeight: "600",
                marginBottom: 1,
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              Rp{" "}
              {order.total_price
                ? order.total_price.toLocaleString("id-ID")
                : "0"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
