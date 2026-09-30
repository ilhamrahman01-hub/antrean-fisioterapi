'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Antrean } from '@/lib/types';
import { maskNIK, formatTanggalIndo } from '@/lib/queue-rules';

export default function PetugasPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  
  function getWibTodayStr(): string {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + 3600000 * 7).toISOString().split('T')[0];
  }

  const [selectedDate, setSelectedDate] = useState(getWibTodayStr());
  const [antreanList, setAntreanList] = useState<Antrean[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Edit Modal State
  const [editItem, setEditItem] = useState<Antrean | null>(null);
  const [editNik, setEditNik] = useState('');
  const [editNama, setEditNama] = useState('');
  const [editWa, setEditWa] = useState('');
  const [editError, setEditError] = useState('');

  const refreshData = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(pin)}&tanggal=${selectedDate}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setAntreanList(json.data.antreanList || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [pin, selectedDate]);

  const verifyPin = useCallback(async (inputPin: string) => {
    setPinError('');
    try {
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(inputPin)}&tanggal=${selectedDate}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        setAntreanList(json.data.antreanList || []);
        sessionStorage.setItem('petugas_pin', inputPin);
        setPin(inputPin);
      } else {
        setPinError(json.message || 'PIN tidak valid (default: praci123)');
        sessionStorage.removeItem('petugas_pin');
      }
    } catch {
      setPinError('Gagal menghubungi server');
    }
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('petugas_pin');
      if (savedPin) {
        verifyPin(savedPin);
      }
    }
  }, [verifyPin]);

  useEffect(() => {
    if (isAuthenticated && pin) {
      refreshData();
    }
  }, [selectedDate, isAuthenticated, pin, refreshData]);

  async function handleAction(action: 'panggil' | 'selesai' | 'batal', item: Antrean) {
    if (action === 'batal' && !confirm(`Yakin ingin membatalkan antrean ${item.namaPasien}?`)) {
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action, antreanId: item.id }),
      });
      const data = await res.json();
      if (data.success) {
        refreshData();
      } else {
        alert(data.message || 'Gagal memproses aksi');
      }
    } catch {
      alert('Gagal menghubungi server');
    } finally {
      setLoadingAction(false);
    }
  }

  function openEditModal(item: Antrean) {
    setEditItem(item);
    setEditNik(item.nik);
    setEditNama(item.namaPasien);
    setEditWa(item.noWa);
    setEditError('');
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setLoadingAction(true);
    setEditError('');
    try {
      const res = await fetch(`/api/antrean/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, nik: editNik, namaPasien: editNama, noWa: editWa }),
      });
      const data = await res.json();
      if (data.success) {
        setEditItem(null);
        refreshData();
      } else {
        setEditError(data.message || 'Gagal menyimpan perubahan');
      }
    } catch {
      setEditError('Gagal menghubungi server');
    } finally {
      setLoadingAction(false);
    }
  }

  function getWaReminderUrl(item: Antrean): string {
    const cleanPhone = (item.noWa || '').replace(/[\s-+]/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) formattedPhone = '62' + cleanPhone.slice(1);

    const text = 
`*PENGINGAT KUNJUNGAN POLI FISIOTERAPI*
*PUSKESMAS PRACIMANTORO 1*

Halo Bpk/Ibu *${item.namaPasien}*,
Mengingatkan kembali reservasi sesi Fisioterapi Anda untuk jadwal:
📅 *${formatTanggalIndo(item.tanggalKunjungan)}*
⏰ *Jam Layanan:* 08.00 - 12.00 WIB
📍 *Lokasi:* Poli Fisioterapi (Ruang 103)
🔖 *Kode Tiket:* ${item.kodeTiket}

Pelayanan dilayani berdasarkan urutan kedatangan di ruang poli (First Come, First Served). Harap hadir membawa KTP & kartu BPJS asli.

Terima kasih.`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif font-black text-lg text-brand-dark tracking-tight">
            Puskesmas Pracimantoro 1
          </Link>
          <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-wider">
            ← Kembali ke Beranda
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-zinc-200 p-8 max-w-md w-full shadow-lg space-y-6">
            <div className="text-center space-y-2 border-b border-zinc-100 pb-5">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">
                Pusat Kendali Petugas
              </span>
              <h2 className="text-2xl font-serif font-black text-brand-dark">
                Portal Petugas Fisioterapi
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Khusus petugas Poli Fisioterapi untuk melihat & memverifikasi 10 peserta harian.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-red-800 text-white text-xs font-bold uppercase tracking-wider text-center">
                {pinError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyPin(pin);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Masukkan PIN Petugas
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN Petugas (default: praci123)"
                  className="w-full py-2.5 px-3 border border-zinc-300 text-brand-dark text-base focus:outline-none focus:border-brand-dark transition"
                  required
                />
                <p className="text-[10px] text-zinc-400 font-medium mt-1">
                  Default PIN: <code className="bg-zinc-100 px-1 py-0.5">praci123</code> (dapat diatur di Environment Variables).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-dark hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition"
              >
                Masuk ke Portal Petugas
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">
            Portal Petugas Resmi
          </span>
          <h1 className="font-serif font-black text-xl text-brand-dark tracking-tight">
            Data Peserta Fisioterapi • Puskesmas Pracimantoro 1
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-bold text-zinc-500 hover:text-black uppercase tracking-wider"
          >
            Lihat Web Pasien
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem('petugas_pin');
              setIsAuthenticated(false);
              setPin('');
            }}
            className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-wider transition"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8 space-y-6">
        {/* Controls: Date Picker & Summary */}
        <div className="bg-white border border-zinc-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Pilih Tanggal Kunjungan
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-2 px-3 border border-zinc-300 text-sm font-bold text-brand-dark focus:outline-none focus:border-brand-dark"
              />
            </div>
            <button
              onClick={refreshData}
              className="sm:self-end px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider transition"
            >
              🔄 Refresh Data
            </button>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Total Terdaftar
              </span>
              <span className="text-2xl font-serif font-black text-brand-dark">
                {antreanList.length} <span className="text-xs font-normal text-zinc-400">/ 10 Pasien</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Sisa Kuota
              </span>
              <span className="text-2xl font-serif font-black text-emerald-800">
                {Math.max(0, 10 - antreanList.length)} <span className="text-xs font-normal text-zinc-400">Slot</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Pasien */}
        <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="font-serif font-black text-lg text-brand-dark">
              Daftar Pasien ({formatTanggalIndo(selectedDate)})
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              Pelayanan: First Come, First Served
            </span>
          </div>

          {antreanList.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Belum ada pasien yang mendaftar pada tanggal ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode Tiket</th>
                    <th className="py-3 px-4">Nama Pasien</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {antreanList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition">
                      <td className="py-3.5 px-4 font-bold text-zinc-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-dark">
                        {item.kodeTiket}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-dark text-sm">
                        {item.namaPasien}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-600">
                        {maskNIK(item.nik)}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={getWaReminderUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          📱 {item.noWa}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'SELESAI'
                            ? 'bg-zinc-800 text-white'
                            : item.status === 'DIPANGGIL'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          disabled={loadingAction}
                          onClick={() => handleAction('panggil', item)}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Panggil
                        </button>
                        <button
                          disabled={loadingAction}
                          onClick={() => handleAction('selesai', item)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Selesai
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 border border-zinc-300 hover:bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Edit
                        </button>
                        <button
                          disabled={loadingAction}
                          onClick={() => handleAction('batal', item)}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Batal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-serif font-black text-brand-dark">
              Edit Data Pasien ({editItem.kodeTiket})
            </h3>

            {editError && (
              <div className="p-3 bg-red-800 text-white text-xs font-bold uppercase text-center">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  NIK Pasien
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={editNik}
                  onChange={(e) => setEditNik(e.target.value)}
                  className="w-full py-2 px-3 border border-zinc-300 text-sm font-medium focus:outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Nama Pasien
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full py-2 px-3 border border-zinc-300 text-sm font-medium focus:outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={editWa}
                  onChange={(e) => setEditWa(e.target.value)}
                  className="w-full py-2 px-3 border border-zinc-300 text-sm font-medium focus:outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition"
                >
                  {loadingAction ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-3 border border-zinc-300 text-zinc-500 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
