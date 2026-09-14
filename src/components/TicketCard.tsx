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
        setStatusMessage('Antrean berhasil dibatalkan. Kuota telah dikembalikan.');
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

  function handlePrintOrSave() {
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Physical-metaphor Ticket Container (e-Karcis) */}
      <div 
        id="ticket-print-area"
        className="w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300 relative"
      >
        {/* Ticket Header */}
        <div className="bg-emerald-800 text-white p-4 relative">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-1 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
                <span>🏥</span>
                <span>PUSKESMAS PRACIMANTORO 1</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">Poli Fisioterapi</h2>
            </div>
            <div>
              {isCancelled ? (
                <span className="bg-rose-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Dibatalkan
                </span>
              ) : isDone ? (
                <span className="bg-slate-700 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Selesai
                </span>
              ) : (
                <span className="bg-white/20 backdrop-blur-md text-emerald-100 text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                  ✓ Terkonfirmasi Resmi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Center: Big Calling Number */}
        <div className="p-4 flex flex-col items-center justify-center bg-emerald-50/50 border-b border-dashed border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Nomor Antrean Anda
          </span>
          <div className="my-1.5 px-7 py-2.5 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-sm text-center">
            <span className={`text-4xl font-black font-mono tracking-tight ${isCancelled ? 'line-through text-slate-400' : 'text-emerald-800'}`}>
              {antrean.nomorAntrean}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-0.5 rounded-full mt-0.5">
            👥 Urutan ke-{parseInt(antrean.nomorAntrean.replace('FISIO-', ''), 10)} dari Kuota 10 Pasien
          </span>
        </div>

        {/* Ticket Details */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Kunjungan</span>
              <span className="font-bold text-slate-800">{formatTanggalIndo(antrean.tanggalKunjungan)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jam Layanan</span>
              <span className="font-bold text-slate-800">08.00 - 12.00 WIB</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pasien</span>
              <span className="font-bold text-slate-900 text-sm">{antrean.namaPasien}</span>
              <span className="text-xs text-slate-500 block font-mono">NIK: {maskNIK(antrean.nik)}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
              BPJS / UMUM
            </span>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <QRCodeSVG 
                value={antrean.kodeTiket} 
                size={130}
                level="M"
              />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 mt-2">
              {antrean.kodeTiket}
            </span>
            <span className="text-[11px] text-slate-400 text-center mt-0.5">
              Tunjukkan QR Code ini ke petugas loket atau poli fisioterapi
            </span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-semibold">
          {statusMessage}
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled && (
        <div className="space-y-2">
          {/* Tombol Kirim ke WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <span>💬</span>
            <span>Simpan & Kirim Karcis ke WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrintOrSave}
              className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>📥</span>
              <span>Cetak / PDF Karcis</span>
            </button>

            <button
              onClick={() => setCancelModal(true)}
              className="py-2.5 px-3 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>❌</span>
              <span>Batalkan Antrean</span>
            </button>
          </div>
        </div>
      )}

      {/* Panduan Kedatangan Pasien */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
        <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
          <span>💡</span> Panduan Kedatangan Pasien
        </h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <p>
              <strong>Hadir 10–15 Menit Lebih Awal:</strong> Lakukan verifikasi berkas fisik (KTP/Kartu BPJS) di loket pendaftaran puskesmas.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <p>
              <strong>Gunakan Pakaian Nyaman:</strong> Kenakan celana elastis atau pakaian olahraga yang memudahkan manuver gerak fisik dan latihan sendi.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <p>
              <strong>Tunjukkan Karcis Digital Ini:</strong> Langsung arahkan layar handphone Anda ke petugas loket atau perawat jaga poli.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Pembatalan */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Batalkan Antrean Fisioterapi?</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin membatalkan nomor antrean <strong>{antrean.nomorAntrean}</strong>? 
              Slot ini akan dikembalikan ke kuota umum agar dapat dipesan oleh pasien lain yang membutuhkan.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                disabled={cancelling}
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Kembali
              </button>
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5"
              >
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
