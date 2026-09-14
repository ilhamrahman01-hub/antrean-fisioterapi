'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LiveQueueBanner from '@/components/LiveQueueBanner';
import TicketCard from '@/components/TicketCard';
import { Antrean, StatusPoli } from '@/lib/types';

export default function TiketPage() {
  const params = useParams();
  const id = params?.id as string;

  const [antrean, setAntrean] = useState<Antrean | null>(null);
  const [statusPoli, setStatusPoli] = useState<StatusPoli>({
    poliName: 'Poli Fisioterapi',
    ruangan: 'Ruang 103 (Lantai 1)',
    antreanSekarang: 'FISIO-02',
    totalHariIni: 3,
    sisaMenunggu: 1,
    jamLayanan: '08.00 - 12.00 WIB'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [resTiket, resPoli] = await Promise.all([
        fetch(`/api/antrean?q=${id}`),
        fetch('/api/kuota')
      ]);

      const dataTiket = await resTiket.json();
      const dataPoli = await resPoli.json();

      if (dataTiket.success && dataTiket.data) {
        setAntrean(dataTiket.data);
      } else {
        setError(dataTiket.message || 'Karcis antrean tidak ditemukan.');
      }

      if (dataPoli.success && dataPoli.data?.statusPoli) {
        setStatusPoli(dataPoli.data.statusPoli);
      }
    } catch (err) {
      setError('Gagal memuat informasi karcis antrean.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            ← Kembali ke Beranda
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            ID: {id?.slice(0, 12)}...
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Memuat karcis antrean...</p>
          </div>
        ) : error || !antrean ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-sm font-bold text-slate-900">Karcis Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">{error || 'Periksa kembali kode tiket Anda.'}</p>
            <Link
              href="/cek-tiket"
              className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl"
            >
              Cari Karcis via NIK ➔
            </Link>
          </div>
        ) : (
          <>
            {/* Live Queue Monitor Status */}
            <LiveQueueBanner
              statusPoli={statusPoli}
              userQueueNumber={antrean.nomorAntrean}
            />

            {/* Ticket Card Component */}
            <TicketCard
              antrean={antrean}
              onCancelSuccess={() => loadData()}
            />
          </>
        )}
      </main>

      <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        PUSKESMAS PRACIMANTORO 1 &copy; 2026 • Sistem Antrean Mandiri Fisioterapi
      </footer>
    </div>
  );
}
