'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="px-5 sm:px-10 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          <img 
            src="/logo.png" 
            alt="Logo Puskesmas" 
            className="h-8 sm:h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex flex-col border-l border-zinc-200 pl-3 sm:pl-5">
            <span className="font-serif font-black text-brand-dark text-[15px] sm:text-lg tracking-wide leading-tight">
              Puskesmas Pracimantoro 1
            </span>
            <span className="text-[10px] sm:text-xs text-brand-primary font-bold tracking-widest uppercase mt-0.5">
              Poli Fisioterapi
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/cek-tiket"
            className="text-sm font-bold tracking-wide text-zinc-600 hover:text-brand-dark transition underline-offset-4 hover:underline"
          >
            Cek Tiket Saya
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
        >
          <span className={`block w-6 h-0.5 bg-brand-dark transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-brand-dark transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-brand-dark transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-zinc-50 border-t border-zinc-200 ${
          mobileMenuOpen ? 'max-h-32' : 'max-h-0 border-transparent'
        }`}
      >
        <div className="flex flex-col px-5 py-4 space-y-4">
          <Link
            href="/cek-tiket"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-bold uppercase tracking-widest text-brand-dark"
          >
            Cek Tiket Saya
          </Link>
        </div>
      </div>
    </header>
  );
}
