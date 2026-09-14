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
      setError('Masukkan NIK, Kode Tiket, atau Nomor WhatsApp Anda.');
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

      // Simpan ke LocalStorage agar diingat perangkat
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-2">
              🔍
            </div>
            <h2 className="text-lg font-bold text-slate-900">Cek Status & Karcis Saya</h2>
            <p className="text-xs text-slate-500">
              Tidak perlu login/akun. Cukup masukkan NIK atau Kode Tiket Anda.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIK Pasien atau Kode Tiket
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: 3312011234560001 / PKM-FISIO..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Bisa menggunakan 16 digit NIK atau kode tiket yang didapat saat mendaftar.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition shadow-sm flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Mencari Karcis...</span>
                </>
              ) : (
                <>
                  <span>🔎</span>
                  <span>Cari Karcis Antrean</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-emerald-900">💡 Belum memiliki nomor antrean?</p>
          <p className="text-slate-600">
            Anda dapat mendaftar langsung di halaman utama tanpa biaya sepeser pun.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Ambil Nomor Antrean Baru ➔
          </Link>
        </div>
      </main>

      <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        PUSKESMAS PRACIMANTORO 1 &copy; 2026 • Sistem Antrean Mandiri Fisioterapi
      </footer>
    </div>
  );
}
