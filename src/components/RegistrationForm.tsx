'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KuotaHari } from '@/lib/types';
import { validateNIK, validateWhatsApp } from '@/lib/queue-rules';

interface Props {
  kuotaList: KuotaHari[];
  selectedDate: string;
  onSelectDate: (tanggal: string) => void;
}

export default function RegistrationForm({ kuotaList, selectedDate, onSelectDate }: Props) {
  const router = useRouter();

  const [nik, setNik] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [noWa, setNoWa] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedDayInfo = kuotaList.find((k) => k.tanggal === selectedDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Harap pilih jadwal kedatangan pada langkah sebelumnya.');
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch('/api/antrean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalKunjungan: selectedDate,
          nik: nik.trim(),
          namaPasien: namaPasien.trim(),
          noWa: noWa.trim(),
          tipePendaftar: 'MANDIRI',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => null);
      if (!data) {
        setErrorMessage('Respon server tidak terbaca. Cek karcis Anda di halaman "Cek Tiket" sebelum mendaftar ulang agar tidak double.');
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Gagal mendaftarkan antrean.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_ticket_id', data.data.id);
        localStorage.setItem('active_ticket_code', data.data.kodeTiket);
      }

      router.push(`/tiket/${data.data.id}`);
    } catch (err: any) {
      setErrorMessage(
        err?.name === 'AbortError'
          ? 'Permintaan timeout. Jangan daftar ulang dulu — cek karcis Anda di halaman "Cek Tiket" memakai NIK.'
          : 'Koneksi bermasalah. Jika sudah menekan tombol sekali, cek "Cek Tiket" dulu sebelum mencoba lagi agar tidak double.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-8 p-4 bg-black text-white text-sm font-bold uppercase tracking-widest text-center">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Input NIK */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
            Nomor Induk Kependudukan (NIK)
          </label>
          <input
            type="tel"
            maxLength={16}
            value={nik}
            onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
            placeholder="16 Digit NIK KTP..."
            className="w-full py-2 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
            required
          />
          <span className="absolute right-0 bottom-3 text-[10px] text-zinc-400 font-bold tracking-widest">
            {nik.length}/16
          </span>
        </div>

        {/* 2. Input Nama Lengkap */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
            Nama Lengkap Pasien
          </label>
          <input
            type="text"
            value={namaPasien}
            onChange={(e) => setNamaPasien(e.target.value)}
            placeholder="Ketik nama lengkap..."
            className="w-full py-2 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
            required
          />
        </div>

        {/* 3. Input No WhatsApp */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
            Nomor WhatsApp Aktif
          </label>
          <input
            type="tel"
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full py-2 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
           <button
             type="submit"
             disabled={loading || !selectedDate || (selectedDayInfo?.status === 'PENUH')}
             className={`w-full py-4 font-bold text-xs uppercase tracking-widest transition shadow-sm ${
               loading || !selectedDate || (selectedDayInfo?.status === 'PENUH')
                 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                 : 'bg-brand-dark text-white hover:bg-black active:scale-[0.99]'
             }`}
           >
             {loading ? 'MEMPROSES...' : 'AMBIL ANTREAN SEKARANG'}
           </button>
        </div>
      </form>
    </div>
  );
}
