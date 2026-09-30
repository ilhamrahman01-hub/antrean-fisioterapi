'use client';

import React, { useState } from 'react';
import { Antrean } from '@/lib/types';
import { formatTanggalIndo, maskNIK } from '@/lib/queue-rules';
import { generateWhatsAppLink, generateWhatsAppCancelLink } from '@/lib/whatsapp';

interface Props {
  antrean: Antrean;
  queuePosition?: number | null;
  onCancelSuccess?: () => void;
}

export default function TicketCard({ antrean, onCancelSuccess }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isCancelled = antrean.status === 'BATAL';
  const isDone = antrean.status === 'SELESAI';

  const waLink = generateWhatsAppLink(antrean);
  const waCancelLink = generateWhatsAppCancelLink(antrean);

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/antrean/${antrean.id}/batal`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Reservasi antrean berhasil dibatalkan. Kuota telah dikembalikan ke sistem.');
        setCancelModal(false);
        if (onCancelSuccess) onCancelSuccess();
      } else {
        alert(data.message || 'Gagal membatalkan tiket.');
      }
    } catch (e) {
      alert('Gagal menghubungi server.');
    } finally {
      setCancelling(false);
    }
  }

  const tglClean = antrean.tanggalKunjungan.replace(/-/g, '');
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fisioterapi+Puskesmas+Pracimantoro+1&dates=${tglClean}T010000Z/${tglClean}T050000Z&details=Kunjungan+Poli+Fisioterapi.+Kode+Tiket:+${antrean.kodeTiket}.+Pelayanan+sesuai+kedatangan+08.00-12.00+WIB&location=Puskesmas+Pracimantoro+1`;

  return (
    <div className="w-full space-y-8">
      {/* Karcis Resmi */}
      <div 
        id="ticket-print-area"
        className="w-full bg-white border-2 border-zinc-900 p-6 sm:p-10 relative shadow-sm"
      >
        {/* Header Karcis */}
        <div className="flex justify-between items-start border-b border-zinc-200 pb-5 mb-6">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Dokumen Resmi Pelayanan
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-brand-dark">
              Karcis Reservasi Fisioterapi
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Puskesmas Pracimantoro 1</p>
          </div>
          <div>
            {isCancelled ? (
              <span className="px-3 py-1 bg-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-wider rounded-none">
                Dibatalkan
              </span>
            ) : isDone ? (
              <span className="px-3 py-1 bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-none">
                Selesai
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-none">
                Kuota Terjamin
              </span>
            )}
          </div>
        </div>

        {/* Kotak Kode Tiket Terverifikasi (Tanpa Barcode Sesuai Permintaan) */}
        <div className="bg-zinc-50 border border-zinc-200 p-6 sm:p-8 text-center mb-8">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
            Kode Tiket Anda
          </span>
          <div className="inline-block py-2 px-4 bg-white border-2 border-brand-dark">
            <span className={`text-2xl sm:text-3xl font-mono font-black tracking-wider ${
              isCancelled ? 'line-through text-zinc-400' : 'text-brand-dark'
            }`}>
              {antrean.kodeTiket}
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-medium mt-3">
            Tunjukkan kode tiket ini kepada petugas loket saat tiba di Poli Fisioterapi.
          </p>
        </div>

        {/* Informasi Sistem Pelayanan First-Come First-Served */}
        <div className="bg-emerald-50 border-l-4 border-emerald-700 p-4 mb-8 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
            Aturan Pelayanan: Datang Langsung (First Come, First Served)
          </h4>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed">
            Tidak ada nomor urut panggil paten. Pasien yang tiba terlebih dahulu di Poli Fisioterapi (Ruang 103) akan dilayani lebih awal oleh fisioterapis. Jam layanan: <strong>08.00 – 12.00 WIB</strong>.
          </p>
        </div>

        {/* Data Pasien & Jadwal */}
        <div className="space-y-4 border-t border-zinc-200 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Nama Pasien</span>
              <span className="font-bold text-brand-dark text-base">{antrean.namaPasien}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Jadwal Kunjungan</span>
              <span className="font-bold text-brand-dark text-base">{formatTanggalIndo(antrean.tanggalKunjungan)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">NIK Pasien</span>
              <span className="font-bold text-brand-dark text-base">{maskNIK(antrean.nik)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Lokasi Layanan</span>
              <span className="font-bold text-brand-dark text-base">Poli Fisioterapi (Ruang 103)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Kapasitas Layanan: Maksimal 10 Pasien/Hari</span>
          <span>Puskesmas Pracimantoro 1</span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest text-center">
          {statusMessage}
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled ? (
        <div className="space-y-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-brand-dark hover:bg-black text-white text-xs font-bold uppercase tracking-widest text-center block transition shadow-sm"
          >
            Kirim Karcis & Kode ke WhatsApp
          </a>
          
          <a
            href={gcalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-brand-dark text-xs font-bold uppercase tracking-widest text-center block transition"
          >
            Simpan Jadwal ke Google Calendar
          </a>

          <div className="pt-2">
            <button
              onClick={() => setCancelModal(true)}
              className="w-full py-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-widest transition"
            >
              Batalkan Reservasi Kuota Ini
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <a
            href={waCancelLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-zinc-800 hover:bg-black text-white text-xs font-bold uppercase tracking-widest text-center block transition"
          >
            Kirim Info Pembatalan ke WhatsApp
          </a>
        </div>
      )}

      {/* Modal Batal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <h3 className="text-xl font-serif font-black text-brand-dark">Konfirmasi Pembatalan</h3>
            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
              Apakah Anda yakin ingin membatalkan reservasi kuota dengan Kode Tiket <strong>{antrean.kodeTiket}</strong>? Kuota akan segera dikembalikan untuk pasien lain.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="w-full py-3.5 bg-red-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition"
              >
                {cancelling ? 'MEMPROSES...' : 'YA, BATALKAN RESERVASI'}
              </button>
              <button
                disabled={cancelling}
                onClick={() => setCancelModal(false)}
                className="w-full py-3 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-black transition"
              >
                KEMBALI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
