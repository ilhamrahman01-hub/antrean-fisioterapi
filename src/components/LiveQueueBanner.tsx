'use client';

import React from 'react';
import { StatusPoli } from '@/lib/types';

interface Props {
  statusPoli: StatusPoli;
  userQueueNumber?: string;
}

export default function LiveQueueBanner({ statusPoli }: Props) {
  const total = statusPoli.totalHariIni || 0;

  return (
    <div className="w-full border-b border-zinc-200 pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
            Status Layanan Poli Hari Ini
          </span>
          <h3 className="text-xl font-serif font-black text-brand-dark">
            {statusPoli.poliName}
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            {statusPoli.ruangan} • Jam {statusPoli.jamLayanan}
          </p>
        </div>
        
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
            Total Terdaftar Hari Ini
          </span>
          <div className="flex items-baseline sm:justify-end gap-1">
            <span className="text-4xl font-serif font-black text-brand-dark leading-none">
              {total}
            </span>
            <span className="text-xs text-zinc-400 font-bold">/ 10 Pasien</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1.5 leading-relaxed">
        <p className="font-bold text-brand-dark">
          ℹ️ Petunjuk Kedatangan:
        </p>
        <p>
          Pelayanan dilakukan secara <strong>First Come, First Served</strong> (pasien yang datang lebih dahulu ke Ruang 103 akan dilayani lebih awal oleh fisioterapis).
        </p>
        <p>
          Pastikan Anda datang dalam rentang jam layanan <strong>08.00 – 12.00 WIB</strong> dengan membawa KTP dan kartu BPJS asli.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
          Sistem Antrean Real-Time Aktif
        </span>
      </div>
    </div>
  );
}
