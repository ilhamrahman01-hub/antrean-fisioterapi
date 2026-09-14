'use client';

import React from 'react';
import { StatusPoli } from '@/lib/types';

interface Props {
  statusPoli: StatusPoli;
  userQueueNumber?: string;
}

export default function LiveQueueBanner({ statusPoli, userQueueNumber }: Props) {
  const currentNum = statusPoli.antreanSekarang || 'Belum dimulai';
  const total = statusPoli.totalHariIni || 0;

  // Hitung estimasi jika user memiliki tiket hari ini
  let userQueueDiff = null;
  if (userQueueNumber && statusPoli.antreanSekarang) {
    const currentSeq = parseInt(statusPoli.antreanSekarang.replace('FISIO-', ''), 10);
    const userSeq = parseInt(userQueueNumber.replace('FISIO-', ''), 10);
    if (!isNaN(currentSeq) && !isNaN(userSeq)) {
      userQueueDiff = userSeq - currentSeq;
    }
  }

  const percentage = total > 0 && statusPoli.antreanSekarang 
    ? Math.min(100, Math.round((parseInt(statusPoli.antreanSekarang.replace('FISIO-', '')) / 10) * 100))
    : 10;

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-emerald-600/20 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Antrean Aktif Sekarang
          </span>
        </div>
        <span className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
          Poli Fisioterapi
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">
            Sedang Dilayani di {statusPoli.ruangan}
          </p>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {currentNum}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / 10 Pasien
            </span>
          </div>
        </div>

        {userQueueDiff !== null && userQueueDiff > 0 ? (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded-xl px-3 py-1.5 text-right">
            <span className="text-xs font-bold block">{userQueueDiff} Antrean Lagi</span>
            <span className="text-[10px] text-emerald-400/80">Est. ~{userQueueDiff * 15} mnt</span>
          </div>
        ) : (
          <div className="bg-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-right border border-slate-700">
            <span className="text-xs font-semibold block">{statusPoli.sisaMenunggu} Menunggu</span>
            <span className="text-[10px] text-slate-400">{statusPoli.jamLayanan}</span>
          </div>
        )}
      </div>

      {/* Progress Track Micro-visual */}
      <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
