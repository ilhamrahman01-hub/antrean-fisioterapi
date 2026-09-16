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
    <div className="w-full">
      {/* Horizontal Scrollable Container */}
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {kuotaList.map((item) => {
          const isSelected = selectedDate === item.tanggal;
          const isFull = item.status === 'PENUH';
          const dayNum = item.tanggal.split('-')[2];

          return (
            <div
              key={item.tanggal}
              onClick={() => {
                if (!isFull) onSelectDate(item.tanggal);
              }}
              className={`snap-start min-w-[130px] flex flex-col justify-between p-4 border transition-all duration-200 ${
                isFull
                  ? 'cursor-not-allowed border-red-800 bg-red-800 text-white shadow-sm'
                  : isSelected
                  ? 'border-brand-dark bg-brand-dark text-white shadow-inner scale-[0.98]'
                  : 'border-zinc-200 bg-white cursor-pointer hover:border-brand-dark hover:bg-zinc-50 active:scale-95'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isFull ? 'text-red-200' : isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                  {item.namaHari.slice(0, 3)}
                </span>
                <span className={`text-3xl font-serif font-black ${isFull ? 'text-white' : isSelected ? 'text-white' : 'text-brand-dark'}`}>
                  {dayNum}
                </span>
                <p className={`text-[11px] font-medium mt-1.5 ${isFull ? 'text-red-100' : isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {item.tanggalFormatted}
                </p>
              </div>

              <div className={`mt-5 pt-3 border-t ${isFull ? 'border-red-700' : isSelected ? 'border-zinc-700' : 'border-zinc-200'}`}>
                <div className="flex items-end justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    isFull ? 'text-white' : isSelected ? 'text-white' : item.status === 'SISA_SEDIKIT' ? 'text-orange-700' : 'text-brand-primary'
                  }`}>
                    {isFull ? 'Penuh' : item.status === 'SISA_SEDIKIT' ? `Sisa ${item.sisaKuota}` : 'Tersedia'}
                  </span>

                  <div className="text-right leading-none">
                    <span className={`text-sm font-black ${isFull || isSelected ? 'text-white' : 'text-brand-dark'}`}>
                      {item.kuotaTerisi}
                    </span>
                    <span className={`text-[10px] ${isFull ? 'text-red-200' : 'text-zinc-400'}`}>/10</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
