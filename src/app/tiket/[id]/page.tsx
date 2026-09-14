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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 sm:px-12 sm:py-20 space-y-16">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <Link
            href="/"
            className="text-sm font-bold text-zinc-400 hover:text-brand-dark uppercase tracking-widest transition underline-offset-4 hover:underline"
          >
            Kembali ke Beranda
          </Link>
          <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
            KARCIS ID: {id?.slice(0, 12)}
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm font-bold tracking-widest uppercase text-zinc-400">
            <p>Memuat Data Karcis...</p>
          </div>
        ) : error || !antrean ? (
          <div className="py-20 text-center border-t border-b border-zinc-200 space-y-6">
            <h3 className="text-3xl font-serif font-black text-brand-dark">Karcis Tidak Ditemukan</h3>
            <p className="text-zinc-500 font-medium">{error || 'Periksa kembali kode tiket Anda.'}</p>
            <Link
              href="/cek-tiket"
              className="inline-block mt-4 text-sm font-bold text-brand-dark border-b-2 border-brand-dark pb-1 hover:text-black hover:border-black transition"
            >
              Cari Karcis via NIK
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            <div className="lg:col-span-6 space-y-12">
              <div>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Monitor Antrean Langsung
                </h2>
                <LiveQueueBanner
                  statusPoli={statusPoli}
                  userQueueNumber={antrean.nomorAntrean}
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              <TicketCard
                antrean={antrean}
                onCancelSuccess={() => loadData()}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-12 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Puskesmas Pracimantoro 1 &copy; 2026
        </span>
      </footer>
    </div>
  );
}
