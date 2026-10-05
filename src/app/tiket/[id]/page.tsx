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

  const [antrean, setAntrean] = useState<(Antrean & { queuePosition?: number }) | null>(null);
  const [statusPoli, setStatusPoli] = useState<StatusPoli>({
    poliName: 'Poli Fisioterapi',
    ruangan: 'Ruang 103 (Lantai 1)',
    antreanSekarang: null,
    totalHariIni: 0,
    sisaMenunggu: 0,
    jamLayanan: '08.00 - 12.00 WIB'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [resTiket, resPoli] = await Promise.all([
        fetch(`/api/antrean?q=${encodeURIComponent(id)}`, { cache: 'no-store' }),
        fetch('/api/kuota', { cache: 'no-store' })
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8 sm:px-10 sm:py-12 space-y-12">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <Link
            href="/"
            className="text-xs font-bold text-zinc-500 hover:text-brand-dark uppercase tracking-widest transition underline-offset-4 hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
            ID: {id?.slice(0, 16)}
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-xs font-bold tracking-widest uppercase text-zinc-400">
            <p>Memuat Data Karcis...</p>
          </div>
        ) : error || !antrean ? (
          <div className="py-16 text-center border border-zinc-200 p-8 space-y-5 bg-zinc-50">
            <h3 className="text-2xl font-serif font-black text-brand-dark">Karcis Tidak Ditemukan</h3>
            <p className="text-sm text-zinc-600 font-medium max-w-md mx-auto leading-relaxed">
              {error || 'Data reservasi untuk karcis ini tidak ditemukan di sistem.'}
            </p>
            <div className="pt-2">
              <Link
                href="/cek-tiket"
                className="inline-block px-6 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition"
              >
                Cari Karcis via NIK
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div>
                <LiveQueueBanner
                  statusPoli={statusPoli}
                  userQueueNumber={antrean.nomorAntrean}
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <TicketCard
                antrean={antrean}
                queuePosition={antrean.queuePosition}
                onCancelSuccess={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('active_ticket_id');
                    localStorage.removeItem('active_ticket_code');
                  }
                  loadData();
                }}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Puskesmas Pracimantoro 1 &copy; 2026
        </span>
      </footer>
    </div>
  );
}
