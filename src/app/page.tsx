'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import QuotaCard from '@/components/QuotaCard';
import RegistrationForm from '@/components/RegistrationForm';
import { KuotaHari } from '@/lib/types';

export default function Home() {
  const [kuotaList, setKuotaList] = useState<KuotaHari[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuota = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/kuota', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setKuotaList(json.data.kuota || []);
        setSelectedDate((prev) => {
          if (prev) {
            const stillExists = (json.data.kuota || []).find((k: KuotaHari) => k.tanggal === prev);
            if (stillExists) return prev;
          }
          const available = (json.data.kuota || []).find((k: KuotaHari) => k.isBisaDaftar);
          return available ? available.tanggal : '';
        });
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Gagal mengambil data kuota:', err);
    } finally {
      setLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_ticket_id');
      if (stored) setSavedTicketId(stored);
    }

    fetchQuota(false);

    // Auto-refresh interval setiap 10 detik agar kuota selalu real-time
    const interval = setInterval(() => {
      fetchQuota(false);
    }, 10000);

    // Refetch otomatis saat user membuka kembali tab browser
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchQuota(false);
      }
    }
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', () => fetchQuota(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', () => fetchQuota(false));
    };
  }, [fetchQuota]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-6 sm:px-8 sm:py-10">
        
        {/* Banner Auto-Detect Tiket di Perangkat Ini */}
        {savedTicketId && (
          <div className="bg-brand-dark text-white p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-zinc-800">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                Karcis Aktif Terdeteksi
              </span>
              <h4 className="font-serif font-black text-lg tracking-wide">
                Anda Memiliki Karcis Reservasi di Perangkat Ini
              </h4>
              <p className="text-xs text-zinc-300 font-medium mt-1 leading-relaxed">
                Tekan tombol di samping untuk langsung melihat karcis atau membagikan ke WhatsApp.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/tiket/${savedTicketId}`}
                className="bg-white text-brand-dark px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 transition text-center"
              >
                Buka Karcis
              </Link>
            </div>
          </div>
        )}

        {/* Editorial Hero Section */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-brand-primary uppercase tracking-widest">
                Layanan Rawat Jalan
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Kuota Terbatas 10 Pasien/Hari
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-brand-dark tracking-tight leading-[1.15]">
              Reservasi Kuota<br/>Poli Fisioterapi.
            </h1>
            <p className="text-sm text-zinc-600 font-medium mt-4 max-w-xl leading-relaxed">
              Pendaftaran kuota online untuk mengamankan 1 dari 10 kuota pasien harian. Pelayanan di poli dilakukan secara <strong>First Come, First Served</strong> (pasien yang tiba lebih dulu di Ruang 103 akan dilayani lebih awal).
            </p>
          </div>
          
          <div className="md:col-span-4 border-l-2 border-zinc-200 pl-5 space-y-4">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-widest mb-0.5">Hari Layanan</span>
              <span className="font-bold text-zinc-900 text-sm">Senin – Kamis</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-widest mb-0.5">Jam Operasional</span>
              <span className="font-bold text-zinc-900 text-sm">08.00 – 12.00 WIB</span>
            </div>
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <Link
                href="/cek-tiket"
                className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                🔍 Cek Karcis via NIK
              </Link>
            </div>
          </div>
        </div>

        <hr className="border-t border-zinc-200 mb-10" />

        {/* Unified Registration Flow */}
        <div className="max-w-2xl mx-auto space-y-12">
          
          {/* Tahap 1: Pilih Jadwal */}
          <section className="space-y-4">
            <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-0.5">
                  Langkah 1 dari 2
                </span>
                <h2 className="font-serif font-black text-xl text-brand-dark">
                  Pilih Jadwal Kedatangan
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Sinkron: {lastUpdated}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchQuota(true)}
                  disabled={isRefreshing}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-zinc-300 hover:border-black text-zinc-600 transition"
                  title="Segarkan data kuota sekarang"
                >
                  {isRefreshing ? '...' : 'Segarkan'}
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="py-8 text-center text-xs font-bold tracking-widest uppercase text-zinc-400">
                Memuat data ketersediaan kuota...
              </div>
            ) : (
              <QuotaCard
                kuotaList={kuotaList}
                selectedDate={selectedDate}
                onSelectDate={(t) => setSelectedDate(t)}
              />
            )}
          </section>

          {/* Tahap 2: Data Pasien */}
          <section className="space-y-5">
            <div className="border-b border-zinc-200 pb-3">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-0.5">
                Langkah 2 dari 2
              </span>
              <h2 className="font-serif font-black text-xl text-brand-dark">
                Lengkapi Data Pasien
              </h2>
            </div>

            <RegistrationForm
              kuotaList={kuotaList}
              selectedDate={selectedDate}
              onSelectDate={(t) => setSelectedDate(t)}
            />
          </section>

        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 font-medium space-y-2">
        <p>Puskesmas Pracimantoro 1 &copy; 2026</p>
        <div className="flex justify-center gap-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <Link href="/panduan" className="hover:text-black">Panduan</Link>
          <span>•</span>
          <Link href="/cek-tiket" className="hover:text-black">Cek Karcis</Link>
          <span>•</span>
          <Link href="/petugas" className="hover:text-black">Portal Petugas</Link>
        </div>
      </footer>
    </div>
  );
}
