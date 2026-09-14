import { NextRequest, NextResponse } from 'next/server';
import { readAllAntrean, saveAllAntrean } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { nik, namaPasien, noWa, pin } = body;

    const PETUGAS_PIN = process.env.PETUGAS_PIN || 'praci123';
    if (pin !== PETUGAS_PIN) {
      return NextResponse.json({ success: false, message: 'PIN Petugas tidak valid' }, { status: 401 });
    }

    const all = readAllAntrean();
    const target = all.find(a => a.id === id);

    if (!target) {
      return NextResponse.json({ success: false, message: 'Antrean tidak ditemukan' }, { status: 404 });
    }

    // Validasi batas waktu edit (H-1 Jam 19:00 WIB / 12 jam sebelum jam 07:00 H-0)
    const tglArr = target.tanggalKunjungan.split('-');
    const tahun = parseInt(tglArr[0]);
    const bulan = parseInt(tglArr[1]) - 1;
    const hari = parseInt(tglArr[2]);
    
    const targetDateObj = new Date(tahun, bulan, hari, 7, 0, 0); // Jam 7 pagi hari H
    const limitTime = targetDateObj.getTime() - (12 * 60 * 60 * 1000); // 12 jam sebelumnya
    
    if (Date.now() > limitTime) {
      return NextResponse.json({ success: false, message: 'Batas waktu edit sudah habis (Maksimal H-1 pukul 19:00 WIB).' }, { status: 400 });
    }

    if (nik) target.nik = nik.trim();
    if (namaPasien) target.namaPasien = namaPasien.trim();
    if (noWa) target.noWa = noWa.trim();

    saveAllAntrean(all);

    return NextResponse.json({ success: true, data: target });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal mengubah data antrean' }, { status: 500 });
  }
}
