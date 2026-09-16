import { NextRequest, NextResponse } from 'next/server';
import { readAllAntrean, saveAllAntrean, getPoliState, setPoliState, getWIBDate, getAntreanByTanggal } from '@/lib/db';
import { parseSequence } from '@/lib/queue-rules';

export const dynamic = 'force-dynamic';

const PETUGAS_PIN = process.env.PETUGAS_PIN || 'praci123';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin');
  const tanggal = searchParams.get('tanggal');

  if (pin !== PETUGAS_PIN) {
    return NextResponse.json({ success: false, message: 'PIN Petugas tidak valid' }, { status: 401 });
  }

  const todayStr = getWIBDate().toISOString().split('T')[0];
  const targetDate = tanggal || todayStr;

  const targetList = getAntreanByTanggal(targetDate).filter(a => a.status !== 'BATAL');
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

    const normNomor = (n: string) => {
      const d = (n || '').replace(/\D/g, '').slice(-2);
      const v = parseInt(d, 10);
      return isNaN(v) ? n : v.toString().padStart(2, '0');
    };

    const all = readAllAntrean();
    const matchDay = (a: (typeof all)[number], nomor: string) =>
      a.tanggalKunjungan === todayStr && normNomor(a.nomorAntrean) === normNomor(nomor);

    if (action === 'panggil') {
      // Panggil nomor spesifik (dinormalisasi agar format lama/baru cocok)
      const nomor = normNomor(nomorAntrean);
      setPoliState({ antreanSekarang: nomor });
      const target = all.find(a => matchDay(a, nomor) && a.status !== 'BATAL');
      if (target) {
        target.status = 'DIPANGGIL';
        target.waktuDipanggil = wib.toISOString();
        saveAllAntrean(all);
      }
      return NextResponse.json({ success: true, message: `Memanggil ${nomor}` });
    }

    if (action === 'panggil_berikutnya') {
      // Cari pasien berikutnya yang berstatus 'MENUNGGU', urut numerik (01 < 02 < ... < 10)
      const nextWaiting = all
        .filter(a => a.tanggalKunjungan === todayStr && a.status === 'MENUNGGU')
        .sort((a, b) => parseSequence(a.nomorAntrean) - parseSequence(b.nomorAntrean))[0];

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
      const nomor = normNomor(nomorAntrean);
      const target = all.find(a => matchDay(a, nomor) && a.status !== 'BATAL');
      if (target) {
        target.status = 'SELESAI';
        target.waktuSelesai = wib.toISOString();
        saveAllAntrean(all);
      }
      return NextResponse.json({ success: true, message: `Antrean ${nomor} ditandai selesai` });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal memproses aksi petugas' }, { status: 500 });
  }
}
