'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Antrean, StatusPoli } from '@/lib/types';
import { maskNIK, formatTanggalIndo } from '@/lib/queue-rules';
import { playChimeBell, speakQueueNumber } from '@/lib/audio';

export default function PetugasPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  
  const [antreanList, setAntreanList] = useState<Antrean[]>([]);
  const [poliState, setPoliState] = useState<{ antreanSekarang: string | null; ruangan: string; jamLayanan: string }>({
    antreanSekarang: 'FISIO-01',
    ruangan: 'Ruang 103',
    jamLayanan: '08.00 - 12.00 WIB'
  });
  const [viewMode, setViewMode] = useState<'OPERATOR' | 'TV_DISPLAY'>('OPERATOR');
  const [loadingAction, setLoadingAction] = useState(false);

  // Auto-login jika PIN tersimpan di sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('petugas_pin');
      if (savedPin) {
        verifyPin(savedPin);
      }
    }
  }, []);

  async function verifyPin(inputPin: string) {
    setPinError('');
    try {
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(inputPin)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        setAntreanList(json.data.antreanList || []);
        setPoliState(json.data.poliState || {});
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
      const res = await fetch(`/api/petugas?pin=${encodeURIComponent(pin)}`);
      const json = await res.json();
      if (json.success) {
        setAntreanList(json.data.antreanList || []);
        setPoliState(json.data.poliState || {});
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePanggilBerikutnya() {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action: 'panggil_berikutnya' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        speakQueueNumber(json.data.nomorAntrean);
        refreshData();
      } else {
        alert(json.message || 'Gagal memanggil');
      }
    } finally {
      setLoadingAction(false);
    }
  }

  async function handlePanggilUlang(nomorAntrean: string) {
    speakQueueNumber(nomorAntrean);
  }

  async function handleSelesai(nomorAntrean: string) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto mb-2">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-900">Akses Petugas Fisioterapi</h2>
            <p className="text-xs text-slate-500">
              Puskesmas Pracimantoro 1 • Masukkan PIN Petugas
            </p>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl text-center font-semibold">
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
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN (Default: praci123)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
                required
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">
                PIN default demo: <code className="font-bold text-slate-600">praci123</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition"
            >
              Masuk Dashboard ➔
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
              ← Kembali ke Layar Pasien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN MODE TV (FULLSCREEN DISPLAY UNTUK RUANG TUNGGU)
  if (viewMode === 'TV_DISPLAY') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col p-6 sm:p-10 select-none">
        <header className="flex justify-between items-center pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-bold">
              ➕
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-emerald-400">
                PUSKESMAS PRACIMANTORO 1
              </h1>
              <p className="text-sm font-semibold text-slate-400">
                POLI FISIOTERAPI • REHABILITASI MEDIK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => playChimeBell()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700"
            >
              🔔 Test Bel
            </button>
            <button
              onClick={() => setViewMode('OPERATOR')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-bold"
            >
              ⚙️ Kembali ke Mode Petugas
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 my-8">
          {/* Main Giant Callout */}
          <div className="w-full md:w-3/5 bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
            <span className="text-sm sm:text-base font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              SEDANG DILAYANI SEKARANG
            </span>

            <div className="my-4 py-6 bg-black/40 rounded-3xl border border-emerald-500/20">
              <span className="text-6xl sm:text-8xl md:text-9xl font-black font-mono text-emerald-300 tracking-tight">
                {poliState.antreanSekarang || '---'}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xl sm:text-2xl font-bold text-white">
                SILAKAN MASUK KE {poliState.ruangan.toUpperCase()}
              </p>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Poli Fisioterapi (Lantai 1)
              </p>
            </div>
          </div>

          {/* Sisa Antrean Hari Ini */}
          <div className="w-full md:w-2/5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-300 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Daftar Antrean Hari Ini</span>
              <span className="text-xs text-emerald-400 font-normal">
                {antreanList.length} / 10 Kuota
              </span>
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {antreanList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    item.nomorAntrean === poliState.antreanSekarang
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : item.status === 'SELESAI'
                      ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-bold">{item.nomorAntrean}</span>
                    <span className="text-sm font-semibold truncate max-w-[140px]">{item.namaPasien}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TAMPILAN MODE OPERATOR / PETUGAS
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-emerald-900 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <h1 className="text-base font-black tracking-wide">
              DASHBOARD PETUGAS POLI FISIOTERAPI
            </h1>
            <p className="text-xs text-emerald-300 font-medium">
              Puskesmas Pracimantoro 1 • Kontrol Antrean & Panggilan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('TV_DISPLAY')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <span>📺</span> Tampilkan Layar TV
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('petugas_pin');
              setIsAuthenticated(false);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Panel Kontrol Pemanggilan Aktif */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-24 h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 flex flex-col items-center justify-center shadow-inner">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Nomor Aktif</span>
              <span className="text-3xl font-black font-mono text-emerald-900">
                {poliState.antreanSekarang || '---'}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Sedang Dilayani di {poliState.ruangan}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Panggilan Pasien Fisioterapi Hari Ini
              </h2>
              <p className="text-xs text-slate-500">
                Tekan tombol panggil untuk membunyikan bel dan mengumumkan nomor secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              disabled={loadingAction}
              onClick={handlePanggilBerikutnya}
              className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <span>🔔</span> Panggil Berikutnya
            </button>

            {poliState.antreanSekarang && (
              <>
                <button
                  onClick={() => handlePanggilUlang(poliState.antreanSekarang!)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                >
                  <span>📢</span> Panggil Ulang
                </button>
                <button
                  onClick={() => handleSelesai(poliState.antreanSekarang!)}
                  className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-300 transition flex items-center gap-1.5"
                >
                  <span>✓</span> Selesai
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabel Pasien Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Pasien Fisioterapi Hari Ini
              </h3>
              <p className="text-xs text-slate-500">
                Maksimal kuota 10 pasien • {antreanList.length} pasien terdaftar
              </p>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <th className="p-3.5 pl-5">No. Antrean</th>
                  <th className="p-3.5">Nama Pasien</th>
                  <th className="p-3.5">NIK Pasien</th>
                  <th className="p-3.5">No. WhatsApp</th>
                  <th className="p-3.5">Tipe</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {antreanList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada pasien yang mendaftar untuk hari ini.
                    </td>
                  </tr>
                ) : (
                  antreanList.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        item.nomorAntrean === poliState.antreanSekarang ? 'bg-emerald-50/50' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-mono font-bold text-sm text-emerald-900">
                        {item.nomorAntrean}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {item.namaPasien}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {maskNIK(item.nik)}
                      </td>
                      <td className="p-3.5">
                        <a
                          href={`https://wa.me/${item.noWa.replace(/^0/, '62')}?text=Halo%20Bpk/Ibu%20${encodeURIComponent(item.namaPasien)},%20antrean%20fisioterapi%20Anda%20segera%20dipanggil.`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline flex items-center gap-1 font-mono font-semibold"
                        >
                          <span>💬</span> {item.noWa}
                        </a>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.tipePendaftar === 'KELUARGA_KADER' ? 'Keluarga/Kader' : 'Mandiri'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.status === 'MENUNGGU' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Menunggu
                          </span>
                        )}
                        {item.status === 'DIPANGGIL' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            Sedang Dilayani
                          </span>
                        )}
                        {item.status === 'SELESAI' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Selesai
                          </span>
                        )}
                        {item.status === 'BATAL' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Batal
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right space-x-1.5">
                        {item.status === 'MENUNGGU' && (
                          <button
                            onClick={async () => {
                              await fetch('/api/petugas', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pin, action: 'panggil', nomorAntrean: item.nomorAntrean }),
                              });
                              speakQueueNumber(item.nomorAntrean);
                              refreshData();
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                          >
                            Panggil
                          </button>
                        )}
                        {item.status === 'DIPANGGIL' && (
                          <button
                            onClick={() => handleSelesai(item.nomorAntrean)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                          >
                            Selesai
                          </button>
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

      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
        Dashboard Internal Puskesmas Pracimantoro 1 • Akses Khusus Petugas Fisioterapi
      </footer>
    </div>
  );
}
