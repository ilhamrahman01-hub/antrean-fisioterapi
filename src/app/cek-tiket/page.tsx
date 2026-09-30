'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function CekTiketPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_ticket_id');
      if (stored) setSavedTicketId(stored);
    }
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const clean = query.trim();
    if (!clean) {
      setError('Masukkan NIK (16 digit) atau Kode Tiket Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/antrean?q=${encodeURIComponent(clean)}`, { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setError(json.message || 'Data antrean tidak ditemukan. Pastikan nomor NIK atau Kode Tiket yang dimasukkan benar.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_ticket_id', json.data.id);
        localStorage.setItem('active_ticket_code', json.data.kodeTiket);
      }

      router.push(`/tiket/${json.data.id}`);
    } catch (err) {
      setError('Gagal menghubungi server. Periksa koneksi internet Anda dan coba lagi.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 sm:py-20">
        <div className="mb-10 border-b border-zinc-200 pb-8">
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-2">
            Pencarian Mandiri
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-brand-dark mb-4">
            Cari Karcis Anda
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 font-medium leading-relaxed">
            Tidak perlu akun atau password. Cukup masukkan <strong>NIK KTP</strong> (16 digit) atau <strong>Kode Tiket</strong> yang Anda peroleh saat mendaftar.
          </p>
        </div>

        {savedTicketId && (
          <div className="mb-8 p-4 bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Karcis Terakhir Tersimpan
              </span>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">
                Perangkat ini mendeteksi Anda pernah mendaftar antrean sebelumnya.
              </p>
            </div>
            <Link
              href={`/tiket/${savedTicketId}`}
              className="px-4 py-2 bg-brand-dark text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition shrink-0"
            >
              Buka Karcis
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Nomor Induk Kependudukan (NIK) atau Kode Tiket
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: 331201... atau PKM-FISIO-..."
              className="w-full py-3 bg-transparent border-b-2 border-zinc-300 text-brand-dark text-xl sm:text-2xl font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
              required
            />
            <p className="text-[11px] text-zinc-400 font-medium mt-2.5">
              Tips: Masukkan 16 digit NIK sesuai yang Anda daftarkan di formulir.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 font-bold text-xs uppercase tracking-widest transition shadow-sm ${
                loading
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-brand-dark text-white hover:bg-black'
              }`}
            >
              {loading ? 'MENCARI DATA KARCIS...' : 'CARI KARCIS SEKARANG'}
            </button>
            <Link
              href="/"
              className="flex-1 py-4 border border-zinc-300 text-brand-dark hover:bg-zinc-50 font-bold text-xs uppercase tracking-widest transition text-center"
            >
              KEMBALI KE BERANDA
            </Link>
          </div>
        </form>

      </main>

      <footer className="border-t border-zinc-200 py-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Puskesmas Pracimantoro 1 &copy; 2026
        </span>
      </footer>
    </div>
  );
}
