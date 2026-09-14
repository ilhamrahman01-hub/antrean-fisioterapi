'use client';

import React from 'react';
import { KuotaHari } from '@/lib/types';

interface Props {
  kuotaList: KuotaHari[];
  selectedDate: string;
  onSelectDate: (tanggal: string) => void;
}

export default function QuotaCard({ kuotaList, selectedDate, onSelectDate }: Props) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Ketersediaan Kuota</h3>
          <p className="text-xs text-slate-500">Pekan Berjalan (Senin – Kamis, Kuota 10/hari)</p>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Real-time
        </span>
      </div>

      <div className="space-y-2.5">
        {kuotaList.map((item) => {
          const isSelected = selectedDate === item.tanggal;
          const isFull = item.status === 'PENUH';
          const percentage = Math.min(100, Math.round((item.kuotaTerisi / item.kuotaMaksimal) * 100));

          // Singkatan hari (SEN, SEL, RAB, KAM)
          const shortDay = item.namaHari.slice(0, 3).toUpperCase();
          const dayNum = item.tanggal.split('-')[2];

          return (
            <div
              key={item.tanggal}
              onClick={() => {
                if (!isFull) onSelectDate(item.tanggal);
              }}
              className={`relative rounded-2xl p-4 transition-all duration-200 border text-left ${
                isFull
                  ? 'bg-slate-50/80 border-slate-200 opacity-80 cursor-not-allowed'
                  : isSelected
                  ? 'bg-emerald-50/60 border-emerald-600 shadow-md ring-2 ring-emerald-500/20 cursor-pointer'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Tanggal Kotak */}
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-center border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : isFull
                        ? 'bg-slate-200 text-slate-500 border-slate-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] tracking-wider leading-none uppercase">{shortDay}</span>
                    <span className="text-base font-extrabold leading-tight">{dayNum}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.namaHari}</h4>
                    <p className="text-xs text-slate-500">{item.tanggalFormatted}</p>
                  </div>
                </div>

                {/* Badge Status */}
                <div>
                  {item.status === 'PENUH' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      🚫 PENUH
                    </span>
                  )}
                  {item.status === 'SISA_SEDIKIT' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                      ⏳ SISA {item.sisaKuota} KUOTA
                    </span>
                  )}
                  {item.status === 'TERSEDIA' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ TERSEDIA (Sisa {item.sisaKuota})
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar & Keterangan */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className={isFull ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                    {item.kuotaTerisi} Pasien Terdaftar
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {item.kuotaTerisi} / {item.kuotaMaksimal} Kuota
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-rose-500'
                        : item.status === 'SISA_SEDIKIT'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  {item.catatan}
                </p>
              </div>

              {isSelected && (
                <div className="mt-2 text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    ✓ Hari Dipilih
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
