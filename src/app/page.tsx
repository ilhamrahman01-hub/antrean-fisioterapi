'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveQueueBanner from '@/components/LiveQueueBanner';
import QuotaCard from '@/components/QuotaCard';
import RegistrationForm from '@/components/RegistrationForm';
import { KuotaHari, StatusPoli } from '@/lib/types';

export default function Home() {
  const [kuotaList, setKuotaList] = useState<KuotaHari[]>([]);
  const [statusPoli, setStatusPoli] = useState<StatusPoli>({
    poliName: 'Poli Fisioterapi',
    ruangan: 'Ruang 103 (Lantai 1)',
    antreanSekarang: 'FISIO-02',
    totalHariIni: 3,
    sisaMenunggu: 1,
    jamLayanan: '08.00 - 12.00 WIB'
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Cek apakah di browser HP ini sudah ada karcis aktif tersimpan
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_ticket_id');
      if (stored) setSavedTicketId(stored);
    }

    // 2. Fetch data kuota harian & status antrean
    async function loadData() {
      try {
        const res = await fetch('/api/kuota');
        const json = await res.json();
        if (json.success && json.data) {
          setKuotaList(json.data.kuota || []);
          if (json.data.statusPoli) {
            setStatusPoli(json.data.statusPoli);
          }
          // Pilih hari pertama yang masih tersedia kuotanya secara default
          const available = (json.data.kuota || []).find((k: KuotaHari) => k.isBisaDaftar);
          if (available) {
            setSelectedDate(available.tanggal);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data kuota:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner Auto-Detect Tiket yang Tersimpan di Perangkat Ini */}
        {savedTicketId && (
          <div className="bg-emerald-800 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 border border-emerald-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎟️</span>
              <div>
                <h4 className="font-bold text-sm">Anda Memiliki Karcis Antrean Aktif</h4>
                <p className="text-xs text-emerald-200">
                  Karcis fisioterapi tersimpan di perangkat ini. Klik untuk melihat nomor dan memantau giliran.
                </p>
              </div>
            </div>
            <Link
              href={`/tiket/${savedTicketId}`}
              className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shrink-0 shadow-sm"
            >
              Lihat Karcis ➔
            </Link>
          </div>
        )}

        {/* Hero Banner Puskesmas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shrink-0">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                  Unit Rehabilitasi Medik
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Aktif
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Poli Fisioterapi Puskesmas Pracimantoro 1
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Layanan terapi fisik intensif 1-on-1. Buka <strong>Senin s/d Kamis (08.00–12.00 WIB)</strong>. Kuota maksimal <strong>10 Pasien/hari</strong>.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jadwal Praktik</span>
              <span className="font-bold text-slate-700">Senin – Kamis</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kapasitas Maksimal</span>
              <span className="font-bold text-emerald-700">10 Pasien / Hari</span>
            </div>
          </div>
        </div>

        {/* Notice Hari Tutup */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <span>📅</span>
          <span>
            <strong>Jumat, Sabtu, Minggu & Libur Nasional: TUTUP.</strong> Pendaftaran dibuka untuk pekan berjalan & pekan depan.
          </span>
        </div>

        {/* Responsif Desktop Split Layout (2 Kolom di Desktop, 1 Kolom di HP) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Live Monitor Antrean & Daftar Kuota Harian (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <LiveQueueBanner statusPoli={statusPoli} />

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                <span className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
                <p>Memuat ketersediaan kuota...</p>
              </div>
            ) : (
              <QuotaCard
                kuotaList={kuotaList}
                selectedDate={selectedDate}
                onSelectDate={(t) => setSelectedDate(t)}
              />
            )}
          </div>

          {/* Kolom Kanan: Form Pendaftaran (7 Cols) */}
          <div className="lg:col-span-7">
            <RegistrationForm
              kuotaList={kuotaList}
              selectedDate={selectedDate}
              onSelectDate={(t) => setSelectedDate(t)}
            />
          </div>
        </div>

        {/* Informasi & Syarat Kunjungan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>ℹ️</span> Informasi & Syarat Kunjungan Poli Fisioterapi
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
              <span>🗓️</span>
              <p>
                <strong>Pendaftaran Terbuka:</strong> Pasien atau keluarga dapat memesan nomor antrean mulai H-7 hingga H-1 sebelum tanggal kedatangan.
              </p>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
              <span>🪪</span>
              <p>
                <strong>Bawa Berkas Fisik:</strong> Harap membawa KTP asli dan Kartu BPJS Kesehatan aktif untuk verifikasi berkas di loket pendaftaran.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        PUSKESMAS PRACIMANTORO 1 &copy; 2026 • Sistem Antrean Mandiri Fisioterapi
      </footer>
    </div>
  );
}
