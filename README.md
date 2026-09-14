# Sistem Antrean & Kuota Poli Fisioterapi - Puskesmas Pracimantoro 1

Aplikasi web mandiri untuk pengelolaan reservasi kuota dan antrean Poli Fisioterapi Puskesmas Pracimantoro 1.

---

## Fitur Utama

1. **Jadwal & Kuota Terbuka (Senin – Kamis):**
   * Layanan beroperasi **Senin s/d Kamis** (08.00–12.00 WIB).
   * Kuota dibatasi ketat maksimal **10 pasien/hari** (transaksi atomik anti over-booking).
   * Jumat, Sabtu, Minggu, & Libur Nasional ditutup otomatis.
2. **Tanpa Wajib Login Akun:**
   * Pasien/keluarga tidak perlu mengingat username atau password.
   * Auto-detect tiket via LocalStorage perangkat.
   * Pencarian karcis mandiri via NIK (16 digit) atau Nomor WhatsApp.
3. **Pendaftaran Fleksibel:**
   * Opsi "Diri Sendiri" atau "Orang Tua / Lansia (oleh Keluarga / Kader Desa)".
4. **Distribusi Karcis WhatsApp (100% Gratis):**
   * Tombol *1-Click Kirim ke WhatsApp* via link resmi `wa.me` dengan format pesan rapi terisi otomatis.
5. **Fitur Batalkan Antrean:**
   * Pasien yang berhalangan hadir dapat membatalkan tiket secara mandiri; kuota langsung kembali bertambah 1 secara real-time.
6. **Layar TV Antrean & Dashboard Petugas (`/petugas`):**
   * Dilindungi PIN Petugas (Default: `praci123`).
   * Panggilan otomatis dengan suara bel pemanggilan antrean ("Ding-Dong").
   * Tampilan fullscreen untuk layar TV ruang tunggu poli.

---

## Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke direktori
cd "antrean-fisioterapi"

# 2. Jalankan server pengembang
npm run dev
```

Buka browser Anda di `http://localhost:3000`.

---

## Cara Deploy ke Vercel (100% Gratis)

1. Push folder ini ke GitHub Anda.
2. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub.
3. Klik **"Add New Project"** dan pilih repositori `antrean-fisioterapi`.
4. Klik **"Deploy"** (tanpa perlu setting rumit apa pun).
5. Vercel akan otomatis memberikan domain HTTPS gratis (misal: `https://antrean-fisioterapi-praci1.vercel.app`).
