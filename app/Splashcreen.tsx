import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(10)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const pulseDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();

    setTimeout(() => {
      pulseDot(dotOpacity1, 0);
      pulseDot(dotOpacity2, 150);
      pulseDot(dotOpacity3, 300);
    }, 700);

    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("user_token");
        await new Promise((res) => setTimeout(res, 2200));

        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };

    checkAuth();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* background */}
      <View
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          borderRadius: 170,
          backgroundColor: "#1e293b",
          top: -80,
          right: -80,
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "#1e293b",
          bottom: -40,
          left: -60,
          opacity: 0.4,
        }}
      />

      <Animated.View
        style={{
          alignItems: "center",
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
        }}
      >
        {/* Icon container */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            backgroundColor: "#10b981",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <Ionicons name="water" size={42} color="#ffffff" />
        </View>
      </Animated.View>

      {/* ── Brand Name ── */}
      <Animated.View style={{ alignItems: "center", opacity: textOpacity }}>
        <Text
          style={{
            fontSize: 38,
            fontWeight: "900",
            color: "#ffffff",
            letterSpacing: -1.5,
          }}
        >
          Clean
          <Text style={{ color: "#10b981" }}>Time</Text>
        </Text>

        <Animated.Text
          style={{
            fontSize: 13,
            color: "#64748b",
            fontWeight: "500",
            marginTop: 6,
            letterSpacing: 0.5,
            transform: [{ translateY: taglineSlide }],
          }}
        >
          Eksklusif Laundry di Genggaman Anda
        </Animated.Text>
      </Animated.View>

      {/* ── Loading dots ──*/}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 56,
          alignItems: "center",
        }}
      >
        {[dotOpacity1, dotOpacity2, dotOpacity3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: i === 1 ? 10 : 8,
              height: i === 1 ? 10 : 8,
              borderRadius: 5,
              backgroundColor: "#10b981",
              opacity: dot,
            }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
