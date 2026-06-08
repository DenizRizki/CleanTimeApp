# Clean Time - Customer Portal Mobile App 📱✨

**Clean Time Mobile** adalah aplikasi client-side (Customer Portal) yang dirancang khusus untuk pelanggan laundry premium. Aplikasi ini dibangun menggunakan **React Native** dengan **Expo Ecosystem** dan **TypeScript** untuk memberikan pengalaman pengguna yang cepat, responsif, dan estetik saat memantau maupun mengelola orderan laundry.

---

## 🚀 Fitur Unggulan Aplikasi

Aplikasi mobile ini dilengkapi dengan berbagai fitur antarmuka modern:

* **Desain Antarmuka Premium (UI/UX):** Layout bersih dengan sentuhan ornamen latar belakang abstrak, kartu form yang melayang (*floating card*), serta branding logo huruf "C" eksklusif bertema siber-laundry.
* **Fitur Show/Hide Password:** Keamanan ekstra yang interaktif, memungkinkan pengguna menyembunyikan atau menampilkan input kata sandi hanya dengan satu ketukan ikon mata.
* **Penyimpanan Kredensial Aman (Secure Authentication):** Menggunakan `Expo SecureStore` berbasis enkripsi perangkat keras untuk menyimpan token akses (`user_token`) dan nama pengguna secara permanen, sehingga pengguna tidak perlu login berulang kali.
* **Manajemen Input Pintar:** Dilengkapi dengan komponen `KeyboardAvoidingView` dan `ScrollView` yang fleksibel untuk memastikan form tidak tertutup oleh keyboard virtual, baik di perangkat Android maupun iOS.
* **Integrasi API Axios Dinamis:** Manajemen request tersentralisasi untuk berkomunikasi secara langsung dengan server backend Laravel.

---

## 🛠️ Tech Stack & Library

Spesifikasi teknologi yang digunakan pada sisi aplikasi mobile:

| Komponen | Teknologi / Library |
| :--- | :--- |
| **Framework Utama** | React Native (Expo SDK) |
| **Bahasa Pemrograman**| TypeScript (Strongly Typed) |
| **Sistem Navigasi** | Expo Router (File-based Routing) |
| **Penyimpanan Lokal** | Expo Secure Store (Encrypted Storage) |
| **Resource Icon** | @expo/vector-icons (Ionicons) |
| **HTTP Client** | Axios |

---

## ⚙️ Langkah Instalasi & Menjalankan Aplikasi

Pastikan Anda sudah menginstal **Node.js** di komputer Anda sebelum mengikuti langkah-langkah di bawah ini:

### 1. Kloning Repositori App
```bash
git clone [https://github.com/username/clean-time-app.git](https://github.com/username/clean-time-app.git)
cd clean-time-app
