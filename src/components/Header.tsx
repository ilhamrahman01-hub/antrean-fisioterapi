import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Logo Puskesmas & GERMAS Kemenkes RI */}
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            ➕
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-sm tracking-wide leading-tight">
              PUSKESMAS PRACIMANTORO 1
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold tracking-wider">
              POLI FISIOTERAPI
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/cek-tiket"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          Cek Tiket Saya
        </Link>
        <Link
          href="/petugas"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1"
        >
          🔒 Petugas
        </Link>
      </div>
    </header>
  );
}
