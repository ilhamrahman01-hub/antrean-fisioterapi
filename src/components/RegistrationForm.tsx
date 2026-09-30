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

export default function RegistrationForm({ kuotaList, selectedDate }: Props) {
  const router = useRouter();

  const [nik, setNik] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [noWa, setNoWa] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedDayInfo = kuotaList.find((k) => k.tanggal === selectedDate);
  const isFull = selectedDayInfo?.status === 'PENUH';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Harap pilih tanggal kedatangan terlebih dahulu.');
      return;
    }

    if (isFull) {
      setErrorMessage('Kuota pada tanggal yang dipilih telah penuh. Silakan pilih hari lain.');
      return;
    }

    const nikValidation = validateNIK(nik);
    if (!nikValidation.valid) {
      setErrorMessage(nikValidation.message || 'NIK tidak valid (wajib 16 digit angka).');
      return;
    }

    if (!namaPasien.trim()) {
      setErrorMessage('Nama lengkap pasien wajib diisi.');
      return;
    }

    const waValidation = validateWhatsApp(noWa);
    if (!waValidation.valid) {
      setErrorMessage(waValidation.message || 'Nomor WhatsApp tidak valid.');
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
        setErrorMessage('Respon server tidak terbaca. Silakan cek karcis Anda di menu "Cek Tiket" sebelum mendaftar ulang.');
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
          ? 'Permintaan timeout. Jangan daftar ulang dulu — cek karcis Anda di menu "Cek Tiket" menggunakan NIK.'
          : 'Koneksi bermasalah. Silakan periksa koneksi internet Anda atau cek menu "Cek Tiket".'
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-6 p-4 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider text-center leading-relaxed">
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
            placeholder="16 Digit NIK KTP Pasien..."
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
            placeholder="Ketik nama lengkap pasien..."
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
            placeholder="Contoh: 081234567890"
            className="w-full py-2 bg-transparent border-b-2 border-zinc-200 text-brand-dark text-lg font-medium focus:outline-none focus:border-brand-dark transition placeholder-zinc-300"
            required
          />
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            Karcis digital dan kode tiket resmi dapat dikirimkan langsung ke nomor WhatsApp ini.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
           <button
             type="submit"
             disabled={loading || !selectedDate || isFull}
             className={`w-full py-4 font-bold text-xs uppercase tracking-widest transition shadow-sm ${
               loading || !selectedDate || isFull
                 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                 : 'bg-brand-dark text-white hover:bg-black active:scale-[0.99]'
             }`}
           >
             {loading ? 'MEMPROSES RESERVASI...' : isFull ? 'KUOTA HARI INI PENUH' : 'RESERVASI KUOTA SEKARANG'}
           </button>
        </div>
      </form>
    </div>
  );
}
