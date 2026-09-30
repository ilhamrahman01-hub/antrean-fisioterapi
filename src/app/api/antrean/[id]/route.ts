import { NextRequest, NextResponse } from 'next/server';
import { readAllAntrean, saveAllAntrean, getWIBDate } from '@/lib/db';
import { validateNIK, validateWhatsApp } from '@/lib/queue-rules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

const PETUGAS_PIN = process.env.PETUGAS_PIN || 'praci123';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await req.json();
    const { pin, nik, namaPasien, noWa } = body;

    if (pin !== PETUGAS_PIN) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: PIN Petugas tidak valid.' },
        { status: 401, headers: noCacheHeaders }
      );
    }

    const all = await readAllAntrean();
    const index = all.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: 'Data antrean tidak ditemukan.' },
        { status: 404, headers: noCacheHeaders }
      );
    }

    const target = all[index];

    // Batas waktu edit: Maksimal H-1 pukul 19:00 WIB
    const tglArr = target.tanggalKunjungan.split('-');
    const tahun = parseInt(tglArr[0]);
    const bulan = parseInt(tglArr[1]) - 1;
    const hari = parseInt(tglArr[2]);
    const targetDateObj = new Date(tahun, bulan, hari, 7, 0, 0);
    const limitTime = targetDateObj.getTime() - (12 * 60 * 60 * 1000);
    
    const wibNow = getWIBDate().getTime();
    if (wibNow > limitTime) {
      return NextResponse.json(
        { success: false, message: 'Batas waktu edit sudah habis (Maksimal H-1 pukul 19:00 WIB).' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (nik) {
      const nikCheck = validateNIK(nik);
      if (!nikCheck.valid) {
        return NextResponse.json({ success: false, message: nikCheck.message }, { status: 400, headers: noCacheHeaders });
      }
      target.nik = nik.replace(/\D/g, '');
    }

    if (namaPasien) {
      target.namaPasien = namaPasien.trim();
    }

    if (noWa) {
      const waCheck = validateWhatsApp(noWa);
      if (!waCheck.valid) {
        return NextResponse.json({ success: false, message: waCheck.message }, { status: 400, headers: noCacheHeaders });
      }
      target.noWa = noWa.trim();
    }

    all[index] = target;
    await saveAllAntrean(all);

    return NextResponse.json(
      { success: true, message: 'Data pasien berhasil diperbarui.', data: target },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data antrean.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
