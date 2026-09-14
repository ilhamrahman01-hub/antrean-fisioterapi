import { NextRequest, NextResponse } from 'next/server';
import { readAllAntrean, saveAllAntrean, getPoliState, setPoliState } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PETUGAS_PIN = process.env.PETUGAS_PIN || 'praci123';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin');
  const tanggal = searchParams.get('tanggal');

  if (pin !== PETUGAS_PIN) {
    return NextResponse.json({ success: false, message: 'PIN Petugas tidak valid' }, { status: 401 });
  }

  const todayStr = new Date(new Date().getTime() + (7 * 3600000)).toISOString().split('T')[0];
  const targetDate = tanggal || todayStr;
  
  const all = readAllAntrean();
  const targetList = all.filter(a => a.tanggalKunjungan === targetDate);
  const state = getPoliState();

  return NextResponse.json({
    success: true,
    data: {
      antreanList: targetList,
      poliState: state
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, action, nomorAntrean } = body;

    if (pin !== PETUGAS_PIN) {
      return NextResponse.json({ success: false, message: 'PIN Petugas tidak valid' }, { status: 401 });
    }

    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wib = new Date(utc + (3600000 * 7));
    const todayStr = wib.toISOString().split('T')[0];
    
    const all = readAllAntrean();

    if (action === 'panggil') {
      // Panggil nomor spesifik
      setPoliState({ antreanSekarang: nomorAntrean });
      const target = all.find(a => a.tanggalKunjungan === todayStr && a.nomorAntrean === nomorAntrean);
      if (target) {
        target.status = 'DIPANGGIL';
        target.waktuDipanggil = wib.toISOString();
        saveAllAntrean(all);
      }
      return NextResponse.json({ success: true, message: `Memanggil ${nomorAntrean}` });
    }

    if (action === 'panggil_berikutnya') {
      // Cari pasien berikutnya yang berstatus 'MENUNGGU'
      const nextWaiting = all
        .filter(a => a.tanggalKunjungan === todayStr && a.status === 'MENUNGGU')
        .sort((a, b) => a.nomorAntrean.localeCompare(b.nomorAntrean))[0];

      if (!nextWaiting) {
        return NextResponse.json({ success: false, message: 'Tidak ada lagi antrean yang menunggu hari ini.' });
      }

      setPoliState({ antreanSekarang: nextWaiting.nomorAntrean });
      nextWaiting.status = 'DIPANGGIL';
      nextWaiting.waktuDipanggil = wib.toISOString();
      saveAllAntrean(all);

      return NextResponse.json({
        success: true,
        message: `Memanggil ${nextWaiting.nomorAntrean} (${nextWaiting.namaPasien})`,
        data: nextWaiting
      });
    }

    if (action === 'selesai') {
      const target = all.find(a => a.tanggalKunjungan === todayStr && a.nomorAntrean === nomorAntrean);
      if (target) {
        target.status = 'SELESAI';
        target.waktuSelesai = wib.toISOString();
        saveAllAntrean(all);
      }
      return NextResponse.json({ success: true, message: `Antrean ${nomorAntrean} ditandai selesai` });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal memproses aksi petugas' }, { status: 500 });
  }
}
