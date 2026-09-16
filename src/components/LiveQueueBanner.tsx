'use client';

import React from 'react';
import { StatusPoli } from '@/lib/types';
import { parseSequence } from '@/lib/queue-rules';

interface Props {
  statusPoli: StatusPoli;
  userQueueNumber?: string;
}

export default function LiveQueueBanner({ statusPoli, userQueueNumber }: Props) {
  const currentNum = statusPoli.antreanSekarang || '-';
  const total = statusPoli.totalHariIni || 0;

  // Hitung estimasi jika user memiliki tiket hari ini
  let userQueueDiff = null;
  if (userQueueNumber && statusPoli.antreanSekarang) {
    const currentSeq = parseSequence(statusPoli.antreanSekarang || '');
    const userSeq = parseSequence(userQueueNumber || '');
    if (!isNaN(currentSeq) && !isNaN(userSeq)) {
      userQueueDiff = userSeq - currentSeq;
    }
  }

  return (
    <div className="w-full border-b-2 border-brand-dark pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-4">
            Status Layanan Saat Ini
          </span>
          <p className="text-sm text-brand-dark font-bold uppercase tracking-widest">
            {statusPoli.poliName}
          </p>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            {statusPoli.ruangan}
          </p>
        </div>
        
        <div className="text-left sm:text-right">
          <span className="text-7xl font-serif font-black text-brand-dark tracking-tighter leading-none block">
            {currentNum}
          </span>
          <div className="text-sm text-zinc-500 font-medium mt-3">
            dari batas 10 Pasien
          </div>
        </div>
      </div>

      {userQueueDiff !== null && userQueueDiff > 0 ? (
        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-brand-primary font-bold uppercase tracking-widest block mb-1">Status Anda</span>
            <span className="text-lg font-bold text-brand-dark">{userQueueDiff} Antrean Lagi</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-1">Estimasi Panggilan</span>
            <span className="text-lg font-bold text-brand-dark">~{userQueueDiff * 15} Menit</span>
          </div>
        </div>
      ) : (
        <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest block mb-1">Pasien Menunggu</span>
            <span className="text-lg font-bold text-brand-dark">{statusPoli.sisaMenunggu} Pasien</span>
          </div>
          <div className="text-left sm:text-right flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-brand-primary font-bold uppercase tracking-widest">Sedang Berlangsung</span>
          </div>
        </div>
      )}
    </div>
  );
}
