'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Antrean } from '@/lib/types';
import { formatTanggalIndo, maskNIK } from '@/lib/queue-rules';
import { generateWhatsAppLink } from '@/lib/whatsapp';

interface Props {
  antrean: Antrean;
  onCancelSuccess?: () => void;
}

export default function TicketCard({ antrean, onCancelSuccess }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isCancelled = antrean.status === 'BATAL';
  const isDone = antrean.status === 'SELESAI';

  const waLink = generateWhatsAppLink(antrean);

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/antrean/${antrean.id}/batal`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Antrean dibatalkan. Kuota telah dikembalikan.');
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
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fisioterapi+Puskesmas+Pracimantoro+1&dates=${tglClean}T010000Z/${tglClean}T050000Z&details=Kunjungan+Poli+Fisioterapi.+Nomor+Antrean:+${antrean.nomorAntrean}.+Kode+Tiket:+${antrean.kodeTiket}&location=Puskesmas+Pracimantoro+1`;

  return (
    <div className="w-full space-y-12">
      {/* Karcis Utama */}
      <div 
        id="ticket-print-area"
        className="w-full bg-white border border-zinc-200 p-8 sm:p-12 relative"
      >
        {/* Header Karcis */}
        <div className="flex justify-between items-start border-b border-zinc-200 pb-6 mb-8">
          <div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              Dokumen Resmi
            </span>
            <h2 className="text-2xl font-serif font-black text-brand-dark">Karcis Fisioterapi</h2>
          </div>
          <div>
            {isCancelled ? (
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Dibatalkan
              </span>
            ) : isDone ? (
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Selesai
              </span>
            ) : (
              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                Terkonfirmasi
              </span>
            )}
          </div>
        </div>

        {/* Nomor Raksasa */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-4">
            Nomor Panggilan
          </span>
          <div className="inline-block px-12 py-6 border-2 border-brand-dark">
            <span className={`text-6xl font-serif font-black tracking-tighter ${isCancelled ? 'line-through text-zinc-300' : 'text-brand-dark'}`}>
              {antrean.nomorAntrean}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500 mt-6">
            Urutan ke-{parseInt(antrean.nomorAntrean.replace('FISIO-', ''), 10)} dari kuota harian.
          </p>
        </div>

        {/* Data Pasien */}
        <div className="space-y-6 border-t border-zinc-200 pt-8 mb-10">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Pasien</span>
              <span className="font-bold text-brand-dark text-lg">{antrean.namaPasien}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Jalur Layanan</span>
              <span className="font-bold text-brand-dark text-lg">UMUM / BPJS</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Jadwal</span>
              <span className="font-bold text-brand-dark text-lg">{formatTanggalIndo(antrean.tanggalKunjungan)}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">NIK</span>
              <span className="font-bold text-brand-dark text-lg">{maskNIK(antrean.nik)}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50">
          <QRCodeSVG 
            value={antrean.kodeTiket} 
            size={120}
            level="M"
            fgColor="#0f2922"
          />
          <span className="font-medium text-sm text-zinc-500 mt-4 tracking-widest">
            {antrean.kodeTiket}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest text-center">
          {statusMessage}
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled && (
        <div className="space-y-4">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-5 bg-brand-dark hover:bg-black text-white text-sm font-bold uppercase tracking-widest text-center block transition"
          >
            Kirim Karcis ke WhatsApp
          </a>
          
          <a
            href={gcalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-5 bg-brand-primary hover:opacity-90 text-white text-sm font-bold uppercase tracking-widest text-center block transition"
          >
            Simpan ke Google Calendar
          </a>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => setCancelModal(true)}
              className="w-full py-4 border border-zinc-300 text-zinc-500 hover:bg-zinc-50 hover:text-black text-xs font-bold uppercase tracking-widest transition"
            >
              Batalkan Antrean
            </button>
          </div>
        </div>
      )}

      {/* Modal Batal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 p-8 sm:p-12 max-w-md w-full shadow-2xl space-y-8 text-center">
            <h3 className="text-2xl font-serif font-black text-brand-dark">Konfirmasi Pembatalan</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Anda akan membatalkan antrean <strong>{antrean.nomorAntrean}</strong>. Slot ini akan dikembalikan ke sistem.
            </p>
            <div className="flex flex-col gap-4">
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="w-full py-4 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest hover:bg-black transition"
              >
                {cancelling ? 'MEMPROSES...' : 'YA, BATALKAN ANTREAN'}
              </button>
              <button
                disabled={cancelling}
                onClick={() => setCancelModal(false)}
                className="w-full py-4 text-zinc-500 text-sm font-bold uppercase tracking-widest hover:text-black transition"
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
