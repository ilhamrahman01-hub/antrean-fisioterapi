'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Antrean } from '@/lib/types';
import { maskNIK } from '@/lib/queue-rules';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('petugas_pin');
      if (savedPin) {
        verifyPin(savedPin);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && pin) {
      refreshData();
    }
  }, [selectedDate]);

  async function verifyPin(inputPin: string) {
    setPinError('');
    try {
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(inputPin)}&tanggal=${selectedDate}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        setAntreanList(json.data.antreanList || []);
        sessionStorage.setItem('petugas_pin', inputPin);
        setPin(inputPin);
      } else {
        setPinError(json.message || 'PIN tidak valid');
        sessionStorage.removeItem('petugas_pin');
      }
    } catch {
      setPinError('Gagal menghubungi server');
    }
  }

  async function refreshData() {
    if (!pin) return;
    try {
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(pin)}&tanggal=${selectedDate}`);
      const json = await res.json();
      if (json.success) {
        setAntreanList(json.data.antreanList || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function isEditable(tglKunjungan: string) {
    if (!tglKunjungan) return false;
    const tglArr = tglKunjungan.split('-');
    const tahun = parseInt(tglArr[0]);
    const bulan = parseInt(tglArr[1]) - 1;
    const hari = parseInt(tglArr[2]);
    const targetDateObj = new Date(tahun, bulan, hari, 7, 0, 0);
    const limitTime = targetDateObj.getTime() - (12 * 60 * 60 * 1000);
    return Date.now() < limitTime;
  }

  function openEditModal(item: Antrean) {
    if (!isEditable(item.tanggalKunjungan)) return;
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

  async function handleSelesai(nomorAntrean: string) {
    if (!confirm(`Tandai antrean ${nomorAntrean} sebagai SELESAI?`)) return;
    setLoadingAction(true);
    try {
      await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action: 'selesai', nomorAntrean }),
      });
      refreshData();
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleBatal(id: string, nomorAntrean: string) {
    if (!confirm(`Batalkan kunjungan ${nomorAntrean}? Slot akan dikembalikan.`)) return;
    setLoadingAction(true);
    try {
      await fetch(`/api/antrean/${id}/batal`, { method: 'POST' });
      refreshData();
    } finally {
      setLoadingAction(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-12">
          <div className="text-center border-b border-zinc-200 pb-8">
            <h2 className="text-4xl font-serif font-black text-brand-dark mb-4">Akses Petugas</h2>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
              Manajemen Kunjungan Fisioterapi
            </p>
          </div>

          {pinError && (
            <div className="p-4 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest text-center">
              {pinError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin(pin);
            }}
            className="space-y-10"
          >
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                PIN Autentikasi
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN"
                className="w-full py-4 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-3xl text-center font-medium focus:outline-none focus:border-brand-dark transition"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-6 bg-brand-dark hover:bg-black text-white font-bold text-sm uppercase tracking-widest transition"
            >
              VERIFIKASI LOG IN
            </button>
          </form>
          
          <div className="text-center">
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition">
              KEMBALI KE BERANDA
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN MANAJEMEN KUNJUNGAN (List Only)
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-brand-dark text-white px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-[10px] font-bold uppercase tracking-widest">
            Manajemen Kunjungan
          </h1>
          <p className="text-xl font-serif font-black mt-0.5">
            Poli Fisioterapi
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('petugas_pin');
            setIsAuthenticated(false);
          }}
          className="px-5 py-2.5 border border-zinc-600 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest transition"
        >
          LOGOUT
        </button>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-1">
        
        {/* Tabel Pasien Hari Ini */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-200 pb-4 mb-6 gap-4">
            <div>
              <h3 className="text-2xl font-serif font-black text-brand-dark">
                Daftar Kunjungan Pasien
              </h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                Kelola status kedatangan dan penyelesaian terapi
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-2 border-b-2 border-brand-dark bg-transparent text-sm font-bold text-brand-dark focus:outline-none"
              />
              <button
                disabled={loadingAction}
                onClick={refreshData}
                className="text-xs font-bold text-brand-dark uppercase tracking-widest hover:underline underline-offset-4 shrink-0"
              >
                {loadingAction ? 'MEMPROSES...' : 'REFRESH DATA'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-900 text-brand-dark uppercase font-bold text-xs tracking-widest">
                  <th className="py-4 px-2">No. Antrean</th>
                  <th className="py-4 px-2">Jadwal</th>
                  <th className="py-4 px-2">Pasien</th>
                  <th className="py-4 px-2">Kontak</th>
                  <th className="py-4 px-2">Status</th>
                  <th className="py-4 px-2 text-right">Aksi Manajerial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {antreanList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-sm">
                      Belum ada data pasien terdaftar
                    </td>
                  </tr>
                ) : (
                  antreanList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-5 px-2 text-xl font-serif font-black text-brand-dark">
                        {item.nomorAntrean}
                      </td>
                      <td className="py-5 px-2">
                        <span className="text-sm font-bold text-brand-dark block">{item.tanggalKunjungan}</span>
                      </td>
                      <td className="py-5 px-2">
                        <span className="font-bold text-brand-dark text-base block">{item.namaPasien}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 block">NIK: {maskNIK(item.nik)}</span>
                      </td>
                      <td className="py-5 px-2">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-sm font-bold text-brand-dark tracking-widest block">
                            {item.noWa}
                          </span>
                          <a
                            href={`https://wa.me/${item.noWa.replace(/^0/, '62')}?text=${encodeURIComponent(
                              `Halo Bpk/Ibu ${item.namaPasien},\n\nMengingatkan jadwal kunjungan Poli Fisioterapi Puskesmas Pracimantoro 1 untuk BESOK HARI (${item.tanggalKunjungan}).\n\nMohon hadir maksimal pukul 08.00 WIB.\nNomor Antrean Anda: *${item.nomorAntrean}*\n\nJika berhalangan hadir, mohon abaikan pesan ini atau batalkan antrean melalui web pendaftaran agar kuota dapat digunakan pasien lain.\n\nTerima kasih.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-dark transition"
                          >
                            Kirim Reminder
                          </a>
                        </div>
                      </td>
                      <td className="py-5 px-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 ${
                          item.status === 'MENUNGGU' ? 'bg-zinc-100 text-zinc-600' : 
                          item.status === 'SELESAI' ? 'bg-brand-dark text-white' : 
                          'bg-red-50 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-5 px-2 text-right">
                        {(item.status === 'MENUNGGU' || item.status === 'DIPANGGIL') && (
                          <div className="flex justify-end gap-2">
                            {isEditable(item.tanggalKunjungan) && (
                              <button
                                disabled={loadingAction}
                                onClick={() => openEditModal(item)}
                                className="px-4 py-2 border border-zinc-300 text-brand-dark text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 transition"
                              >
                                EDIT
                              </button>
                            )}
                            <button
                              disabled={loadingAction}
                              onClick={() => handleSelesai(item.nomorAntrean)}
                              className="px-4 py-2 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition"
                            >
                              SELESAI
                            </button>
                            <button
                              disabled={loadingAction}
                              onClick={() => handleBatal(item.id, item.nomorAntrean)}
                              className="px-4 py-2 border border-zinc-300 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 hover:text-black transition"
                            >
                              BATAL
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
        Manajemen Internal Puskesmas Pracimantoro 1
      </footer>

      {/* MODAL EDIT */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 p-8 sm:p-10 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-serif font-black text-brand-dark mb-2">Edit Data Pasien</h3>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 border-b border-zinc-200 pb-4">
              Antrean: {editItem.nomorAntrean}
            </p>

            {editError && (
              <div className="mb-6 p-4 bg-black text-white text-xs font-bold uppercase tracking-widest text-center">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  NIK Pasien
                </label>
                <input
                  type="text"
                  value={editNik}
                  onChange={(e) => setEditNik(e.target.value.replace(/\D/g, ''))}
                  maxLength={16}
                  className="w-full py-2 border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full py-2 border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={editWa}
                  onChange={(e) => setEditWa(e.target.value)}
                  className="w-full py-2 border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition"
                  required
                />
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full py-4 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition"
                >
                  {loadingAction ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => setEditItem(null)}
                  className="w-full py-4 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-black transition"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
