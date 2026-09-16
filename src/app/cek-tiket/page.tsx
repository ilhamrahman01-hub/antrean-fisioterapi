'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function CekTiketPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const clean = query.trim();
    if (!clean) {
      setError('Masukkan NIK atau Kode Tiket Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/antrean?q=${encodeURIComponent(clean)}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setError(json.message || 'Data antrean tidak ditemukan. Pastikan nomor NIK atau kode tiket yang dimasukkan benar.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_ticket_id', json.data.id);
        localStorage.setItem('active_ticket_code', json.data.kodeTiket);
      }

      router.push(`/tiket/${json.data.id}`);
    } catch (err) {
      setError('Gagal menghubungi server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-20">
        <div className="mb-12 border-b border-zinc-200 pb-12">
          <h2 className="text-4xl font-serif font-black text-brand-dark mb-4">Cari Karcis Anda</h2>
          <p className="text-lg text-zinc-500 font-medium leading-relaxed">
            Tidak perlu login. Cukup masukkan NIK atau Kode Tiket yang Anda peroleh saat mendaftar. Jika punya lebih dari satu tiket, yang ditampilkan adalah tiket terbaru yang masih aktif.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-12">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Nomor Induk Kependudukan (NIK) / Kode Karcis
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: 3312011234560001 atau PKM-FISIO-..."
              className="w-full py-4 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-3xl font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
              required
            />
            <p className="text-xs text-zinc-400 font-medium mt-3">
              Nomor WhatsApp tidak bisa dipakai untuk mencari karcis.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-6">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-6 font-bold text-sm uppercase tracking-widest transition ${
                loading
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-brand-dark text-white hover:bg-black'
              }`}
            >
              {loading ? 'MENCARI DATA...' : 'CARI KARCIS SEKARANG'}
            </button>
            <Link
              href="/"
              className="flex-1 py-6 border border-zinc-300 text-brand-dark hover:bg-zinc-50 font-bold text-sm uppercase tracking-widest transition text-center"
            >
              KEMBALI KE BERANDA
            </Link>
          </div>
        </form>

      </main>

      <footer className="border-t border-zinc-200 py-12 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Puskesmas Pracimantoro 1 &copy; 2026
        </span>
      </footer>
    </div>
  );
}
