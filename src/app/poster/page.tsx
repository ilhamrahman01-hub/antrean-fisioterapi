'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PosterPage() {
  const url = 'https://antrean-fisioterapi.vercel.app';

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-8 print:p-0 print:bg-white">
      
      {/* Tombol Cetak (Sembunyi saat di-print) */}
      <div className="fixed top-8 right-8 no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-brand-dark text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition shadow-xl"
        >
          Cetak Poster (A5)
        </button>
      </div>

      {/* Kontainer A5 */}
      <div 
        className="bg-white shadow-2xl print:shadow-none relative overflow-hidden"
        style={{
          width: '148mm',
          height: '210mm',
          padding: '12mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Dekorasi Garis Tepi Elegan */}
        <div className="w-full h-full border-[3px] border-brand-dark p-6 flex flex-col relative">
          
          {/* Header & Logo */}
          <div className="text-center mt-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Layanan Digital
            </h2>
            <h1 className="text-3xl font-serif font-black text-brand-dark leading-tight">
              PENDAFTARAN FISIOTERAPI
            </h1>
            <div className="w-12 h-1 bg-brand-primary mx-auto mt-6 mb-6"></div>
            <h3 className="text-lg font-bold uppercase tracking-widest text-brand-dark">
              Puskesmas Pracimantoro 1
            </h3>
          </div>

          {/* Area Tengah: QR Code */}
          <div className="flex-1 flex flex-col items-center justify-center mt-4">
            <div className="p-4 border-2 border-zinc-100 bg-white shadow-sm mb-6">
              <QRCodeSVG 
                value={url} 
                size={220}
                level="H"
                bgColor="#ffffff"
                fgColor="#18181b" // zinc-900
              />
            </div>
            
            <p className="text-sm font-bold text-brand-dark uppercase tracking-widest text-center mt-2">
              SCAN KODE QR DI ATAS
            </p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center mt-1">
              menggunakan kamera Handphone Anda
            </p>
          </div>

          {/* Footer Info */}
          <div className="text-center mb-2 border-t border-zinc-200 pt-4">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              Atau kunjungi tautan:
            </p>
            <p className="text-sm font-bold text-brand-primary tracking-widest mt-1">
              antrean-fisioterapi.vercel.app
            </p>
          </div>
          
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A5 portrait;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
