'use client';

import React from 'react';
import Image from 'next/image';

export default function PanduanPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-10 print:py-0 print:bg-white text-zinc-800">
      
      {/* Tombol Cetak PDF */}
      <div className="max-w-4xl mx-auto px-8 mb-8 no-print flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-brand-dark text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition shadow-lg"
        >
          Simpan sebagai PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-12 print:p-0">
        
        {/* Sampul Panduan */}
        <div className="border-b-4 border-brand-dark pb-8 mb-12 mt-8 text-center break-after-page">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Buku Panduan Penggunaan
          </h2>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-dark leading-tight mb-6">
            SISTEM ANTREAN FISIOTERAPI DIGITAL
          </h1>
          <div className="w-16 h-1 bg-brand-primary mx-auto mb-6"></div>
          <h3 className="text-xl font-bold uppercase tracking-widest text-brand-dark">
            Puskesmas Pracimantoro 1
          </h3>
          <p className="mt-8 text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Dokumen ini berisi panduan teknis langkah demi langkah mengenai alur penggunaan sistem antrean digital bagi pasien dan petugas Fisioterapi.
          </p>
        </div>

        {/* Bab 1: Pendaftaran Pasien */}
        <div className="mb-16 break-inside-avoid">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl font-serif font-black text-brand-primary">01</span>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-brand-dark">
              Mengecek Kuota & Memilih Jadwal
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="prose prose-zinc">
              <p>
                Pada halaman utama sistem, pasien akan langsung dihadapkan pada tabel <strong>Ketersediaan Kuota</strong> untuk 7 hari operasional ke depan (Senin-Kamis).
              </p>
              <ul>
                <li><strong>Status Tersedia:</strong> Kuota masih di bawah batas maksimal (10 pasien/hari). Pasien dapat menekan tombol <em>"Pilih & Daftar"</em>.</li>
                <li><strong>Status Penuh:</strong> Secara otomatis muncul jika pendaftar sudah mencapai 10 orang, atau <strong>waktu telah melewati pukul 12:00 WIB</strong> untuk hari tersebut.</li>
              </ul>
              <p className="text-sm bg-zinc-50 p-4 border-l-4 border-brand-primary">
                Aturan Khusus: 1 NIK hanya diizinkan untuk mendaftar <strong>1 kali dalam satu minggu (Senin - Minggu)</strong>.
              </p>
            </div>
            <div className="bg-zinc-100 p-4 rounded-sm">
              {/* Gambar 1: Layar Utama (Kuota) */}
              <img src="/screen_kuota.png" alt="Tampilan Cek Kuota" className="w-full h-auto border border-zinc-200 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Bab 2: Form Pendaftaran */}
        <div className="mb-16 break-inside-avoid">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl font-serif font-black text-brand-primary">02</span>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-brand-dark">
              Mengisi Formulir Pendaftaran
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="order-2 md:order-1 bg-zinc-100 p-4 rounded-sm">
              {/* Gambar 2: Layar Pendaftaran */}
              <img src="/screen_daftar.png" alt="Form Pendaftaran" className="w-full h-auto border border-zinc-200 shadow-sm" />
            </div>
            <div className="order-1 md:order-2 prose prose-zinc">
              <p>
                Setelah memilih hari yang tersedia, formulir pendaftaran bergaya mewah dan bersih akan muncul.
              </p>
              <p>
                Data yang wajib diisi:
              </p>
              <ul>
                <li><strong>Nomor Induk Kependudukan (NIK):</strong> Harus 16 digit angka.</li>
                <li><strong>Nama Lengkap Pasien</strong></li>
                <li><strong>Nomor WhatsApp Aktif:</strong> Format angka (misal: 0812...).</li>
                <li><strong>Tipe Pendaftar:</strong> Umum/Mandiri atau Keluarga Kader.</li>
              </ul>
              <p>
                Sistem dirancang tanpa menggunakan pembuatan akun <em>(passwordless)</em> untuk meminimalisasi kesulitan (*friction*) bagi kelompok pasien lanjut usia.
              </p>
            </div>
          </div>
        </div>

        {/* Bab 3: Karcis Digital */}
        <div className="mb-16 break-inside-avoid">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl font-serif font-black text-brand-primary">03</span>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-brand-dark">
              Karcis Digital & Pengingat (Reminder)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="prose prose-zinc">
              <p>
                Setelah berhasil mendaftar, pasien akan mendapatkan <strong>Karcis Digital</strong> (contoh: FISIO-07).
              </p>
              <p>Karcis ini sangat informatif dan memuat beberapa fitur canggih:</p>
              <ol>
                <li><strong>Simpan ke Google Calendar:</strong> Pasien bisa langsung memasukkan jadwal ini ke kalender HP mereka (Otomatis membunyikan alarm H-1).</li>
                <li><strong>Bagikan via WhatsApp:</strong> Pasien dapat mengirim rangkuman tiket ke nomor WA keluarga.</li>
                <li><strong>Batalkan Antrean:</strong> Apabila berhalangan, pasien dapat membatalkan kunjungan dengan memasukkan NIK. Kuota akan otomatis dikembalikan ke dalam sistem.</li>
              </ol>
            </div>
            <div className="bg-zinc-100 p-4 rounded-sm">
              {/* Gambar 3: Karcis */}
              <img src="/screen_karcis.png" alt="Karcis Antrean" className="w-full h-auto border border-zinc-200 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Bab 4: Dashboard Petugas */}
        <div className="mb-16 break-inside-avoid">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl font-serif font-black text-brand-primary">04</span>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-brand-dark">
              Portal Petugas Fisioterapi
            </h2>
          </div>
          
          <div className="prose prose-zinc max-w-none">
            <p>
              Petugas memiliki akses tersembunyi (`/petugas`) yang dilindungi PIN Rahasia (`praci123`). Halaman ini berfungsi sebagai pusat kendali (*command center*).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-zinc-50 border border-zinc-200 p-6">
                <h3 className="text-brand-dark uppercase tracking-widest font-bold text-sm mb-2">Manajemen Pasien</h3>
                <p className="text-sm">
                  Petugas dapat menekan tombol <strong>PANGGIL</strong> (untuk memperbarui layar TV ruang tunggu) dan tombol <strong>SELESAI</strong> saat sesi Fisioterapi berakhir.
                </p>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 p-6">
                <h3 className="text-brand-dark uppercase tracking-widest font-bold text-sm mb-2">Filter Tanggal & Edit Data</h3>
                <p className="text-sm">
                  Terdapat kalender untuk melihat daftar pasien di hari-hari mendatang. Petugas memiliki hak istimewa untuk mengedit data pasien (nama, wa, NIK), selama dilakukan maksimal H-1 (sebelum pukul 19:00 WIB).
                </p>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 p-6 md:col-span-2">
                <h3 className="text-brand-dark uppercase tracking-widest font-bold text-sm mb-2">Kirim Reminder WA Otomatis</h3>
                <p className="text-sm">
                  Pada kolom aksi, terdapat tombol <strong>Kirim Reminder</strong>. Saat diklik, sistem akan otomatis membuka WhatsApp Web milik petugas dengan templat teks yang sudah disusun rapi (menyebutkan nama pasien, nomor tiket, jam layanan) tanpa perlu mengetik manual.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          .no-print {
            display: none !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .break-after-page {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
