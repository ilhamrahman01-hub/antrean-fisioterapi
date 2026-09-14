'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import QuotaCard from '@/components/QuotaCard';
import RegistrationForm from '@/components/RegistrationForm';
import { KuotaHari, StatusPoli } from '@/lib/types';

export default function Home() {
  const [kuotaList, setKuotaList] = useState<KuotaHari[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_ticket_id');
      if (stored) setSavedTicketId(stored);
    }

    async function loadData() {
      try {
        const res = await fetch('/api/kuota');
        const json = await res.json();
        if (json.success && json.data) {
          setKuotaList(json.data.kuota || []);
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-6 sm:px-8 sm:py-10">
        
        {/* Banner Auto-Detect Tiket */}
        {savedTicketId && (
          <div className="bg-brand-dark text-white p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-serif font-black text-lg tracking-wide">Karcis Aktif Terdeteksi</h4>
              <p className="text-sm text-zinc-300 font-medium mt-1 leading-relaxed">
                Sistem mendeteksi bahwa Anda telah memiliki nomor antrean di perangkat ini.
              </p>
            </div>
            <Link
              href={`/tiket/${savedTicketId}`}
              className="bg-white text-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-light transition shrink-0 text-center"
            >
              Lihat Karcis
            </Link>
          </div>
        )}

        {/* Editorial Hero Section */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3">
              Layanan Rawat Jalan
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-brand-dark tracking-tight leading-[1.1]">
              Reservasi Antrean<br/>Poli Fisioterapi.
            </h1>
            <p className="text-sm text-zinc-500 font-medium mt-4 max-w-xl leading-relaxed">
              Fasilitas terapi fisik intensif dengan kapasitas layanan eksklusif maksimal 10 pasien per hari demi menjaga kualitas penanganan.
            </p>
          </div>
          
          <div className="md:col-span-4 border-l-2 border-zinc-200 pl-5">
            <div className="mb-4">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-widest mb-1">Jadwal Operasional</span>
              <span className="font-bold text-zinc-900 text-sm">Senin – Kamis</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-widest mb-1">Jam Layanan</span>
              <span className="font-bold text-zinc-900 text-sm">08.00 – 12.00 WIB</span>
            </div>
          </div>
        </div>

        <hr className="border-t border-zinc-200 mb-10" />

        {/* Unified Registration Flow */}
        <div className="max-w-2xl mx-auto space-y-12">
          
          {/* Tahap 1: Pilih Jadwal */}
          <section className="space-y-5">
            <div className="border-b border-zinc-200 pb-3">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-1">
                Langkah 1 dari 2
              </span>
              <h2 className="font-serif font-black text-xl text-brand-dark">
                Pilih Jadwal Kedatangan
              </h2>
            </div>
            
            {loading ? (
              <div className="py-8 text-center text-xs font-bold tracking-widest uppercase text-zinc-400">
                Memuat data jadwal...
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
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-1">
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

      <footer className="border-t border-zinc-200 py-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Puskesmas Pracimantoro 1 &copy; 2026
        </span>
      </footer>
    </div>
  );
}
