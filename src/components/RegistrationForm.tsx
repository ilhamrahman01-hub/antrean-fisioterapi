'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KuotaHari, TipePendaftar } from '@/lib/types';
import { validateNIK, validateWhatsApp } from '@/lib/queue-rules';

interface Props {
  kuotaList: KuotaHari[];
  selectedDate: string;
  onSelectDate: (tanggal: string) => void;
}

export default function RegistrationForm({ kuotaList, selectedDate, onSelectDate }: Props) {
  const router = useRouter();

  const [tipePendaftar, setTipePendaftar] = useState<TipePendaftar>('MANDIRI');
  const [nik, setNik] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [noWa, setNoWa] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sisa kuota hari terpilih
  const selectedDayInfo = kuotaList.find((k) => k.tanggal === selectedDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Silakan pilih hari kedatangan terlebih dahulu.');
      return;
    }

    const nikValidation = validateNIK(nik);
    if (!nikValidation.valid) {
      setErrorMessage(nikValidation.message || 'NIK tidak valid');
      return;
    }

    if (!namaPasien.trim()) {
      setErrorMessage('Nama lengkap pasien wajib diisi.');
      return;
    }

    const waValidation = validateWhatsApp(noWa);
    if (!waValidation.valid) {
      setErrorMessage(waValidation.message || 'Nomor WhatsApp tidak valid');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/antrean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalKunjungan: selectedDate,
          nik: nik.trim(),
          namaPasien: namaPasien.trim(),
          noWa: noWa.trim(),
          tipePendaftar,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Gagal mendaftarkan antrean.');
        setLoading(false);
        return;
      }

      // Simpan tiket ke LocalStorage agar otomatis terdeteksi tanpa akun
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_ticket_id', data.data.id);
        localStorage.setItem('active_ticket_code', data.data.kodeTiket);
      }

      // Alihkan langsung ke halaman tiket resmi
      router.push(`/tiket/${data.data.id}`);
    } catch (err) {
      setErrorMessage('Koneksi bermasalah. Silakan periksa jaringan internet Anda.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
      <div>
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>📝</span> Form Pendaftaran Antrean Fisioterapi
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Proses kilat tanpa antre di loket. Karcis resmi langsung terbit.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Pilih Hari Kedatangan (Quick Pill Selector) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Hari Kedatangan
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {kuotaList.map((k) => {
              const isSelected = selectedDate === k.tanggal;
              const isFull = k.status === 'PENUH';
              return (
                <button
                  type="button"
                  key={k.tanggal}
                  disabled={isFull}
                  onClick={() => onSelectDate(k.tanggal)}
                  className={`p-2.5 rounded-xl border text-center transition text-xs flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-sm'
                      : isFull
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <span className="text-[10px] uppercase opacity-80">{k.namaHari}</span>
                  <span className="text-sm font-extrabold">{k.tanggal.split('-')[2]} {k.namaHari.slice(0, 3)}</span>
                  <span
                    className={`text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : isFull
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isFull ? 'Penuh' : `Sisa ${k.sisaKuota}`}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedDayInfo && (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
              ✓ Dipilih: {selectedDayInfo.tanggalFormatted} (Tersedia {selectedDayInfo.sisaKuota} Kuota)
            </p>
          )}
        </div>

        {/* 2. Tipe Pendaftar */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Pendaftar
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipePendaftar('MANDIRI')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                tipePendaftar === 'MANDIRI'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>👤</span> Diri Sendiri
            </button>
            <button
              type="button"
              onClick={() => setTipePendaftar('KELUARGA_KADER')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                tipePendaftar === 'KELUARGA_KADER'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🤝</span> Orang Tua / Kader
            </button>
          </div>
          {tipePendaftar === 'KELUARGA_KADER' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1.5">
              💡 Masukkan NIK & Nama Orang Tua / Pasien, dan Nomor WA Anda sendiri untuk menerima karcis digital.
            </p>
          )}
        </div>

        {/* 3. Input NIK */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700">
              Nomor Induk Kependudukan (NIK)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {nik.length}/16 Digit
            </span>
          </div>
          <input
            type="tel"
            maxLength={16}
            value={nik}
            onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: 3312011234560001"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Sesuai e-KTP atau Kartu Keluarga (16 Digit Angka).
          </p>
        </div>

        {/* 4. Input Nama Lengkap */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Lengkap Pasien
          </label>
          <input
            type="text"
            value={namaPasien}
            onChange={(e) => setNamaPasien(e.target.value)}
            placeholder="Contoh: Bpk. Bambang Sutrisno"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            required
          />
        </div>

        {/* 5. Input No WhatsApp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nomor WhatsApp Aktif
          </label>
          <input
            type="tel"
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Karcis resmi & estimasi panggilan antrean akan dikirimkan ke nomor ini.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (selectedDayInfo?.status === 'PENUH')}
          className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition shadow-md flex items-center justify-center gap-2 ${
            loading || (selectedDayInfo?.status === 'PENUH')
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Memproses Tiket...</span>
            </>
          ) : (
            <>
              <span>🎟️</span>
              <span>Konfirmasi & Ambil Antrean</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400">
          🔒 Nomor antrean resmi (1–10) langsung diterbitkan & disimpan otomatis di perangkat Anda.
        </p>
      </form>
    </div>
  );
}
