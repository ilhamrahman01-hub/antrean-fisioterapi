import { NextRequest, NextResponse } from 'next/server';
import { readAllAntrean, saveAllAntrean, getPoliState, setPoliState, getWIBDate, getAntreanByTanggal } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

const PETUGAS_PIN = process.env.PETUGAS_PIN || 'praci123';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin');
  const tanggal = searchParams.get('tanggal');

  if (pin !== PETUGAS_PIN) {
    return NextResponse.json(
      { success: false, message: 'Akses ditolak: PIN Petugas tidak valid.' },
      { status: 401, headers: noCacheHeaders }
    );
  }

  const todayStr = getWIBDate().toISOString().split('T')[0];
  const targetDate = tanggal || todayStr;

  const targetList = (await getAntreanByTanggal(targetDate)).filter(a => a.status !== 'BATAL');
  const state = await getPoliState();

  return NextResponse.json(
    {
      success: true,
      data: {
        antreanList: targetList,
        poliState: state
      }
    },
    { headers: noCacheHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, action, antreanId, kodeTiket } = body;

    if (pin !== PETUGAS_PIN) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: PIN Petugas tidak valid.' },
        { status: 401, headers: noCacheHeaders }
      );
    }

    const wib = getWIBDate();
    const todayStr = wib.toISOString().split('T')[0];
    const all = await readAllAntrean();

    const findTarget = () => {
      if (antreanId) return all.find(a => a.id === antreanId);
      if (kodeTiket) return all.find(a => a.kodeTiket.toUpperCase() === kodeTiket.toUpperCase());
      return undefined;
    };

    if (action === 'panggil') {
      const target = findTarget();
      if (!target) {
        return NextResponse.json({ success: false, message: 'Antrean tidak ditemukan' }, { status: 404, headers: noCacheHeaders });
      }

      await setPoliState({ antreanSekarang: target.nomorAntrean });
      target.status = 'DIPANGGIL';
      target.waktuDipanggil = wib.toISOString();
      await saveAllAntrean(all);

      return NextResponse.json(
        { success: true, message: `Memanggil pasien ${target.namaPasien} (${target.kodeTiket})` },
        { headers: noCacheHeaders }
      );
    }

    if (action === 'panggil_berikutnya') {
      const nextWaiting = all
        .filter(a => a.tanggalKunjungan === todayStr && a.status === 'MENUNGGU')
        .sort((a, b) => a.waktuDaftar.localeCompare(b.waktuDaftar))[0];

      if (!nextWaiting) {
        return NextResponse.json(
          { success: false, message: 'Tidak ada lagi antrean pasien yang menunggu hari ini.' },
          { headers: noCacheHeaders }
        );
      }

      await setPoliState({ antreanSekarang: nextWaiting.nomorAntrean });
      nextWaiting.status = 'DIPANGGIL';
      nextWaiting.waktuDipanggil = wib.toISOString();
      await saveAllAntrean(all);

      return NextResponse.json(
        {
          success: true,
          message: `Memanggil ${nextWaiting.namaPasien} (${nextWaiting.kodeTiket})`,
          data: nextWaiting
        },
        { headers: noCacheHeaders }
      );
    }

    if (action === 'selesai') {
      const target = findTarget();
      if (target) {
        target.status = 'SELESAI';
        target.waktuSelesai = wib.toISOString();
        await saveAllAntrean(all);
      }
      return NextResponse.json(
        { success: true, message: 'Antrean pasien berhasil ditandai selesai.' },
        { headers: noCacheHeaders }
      );
    }

    if (action === 'batal') {
      const target = findTarget();
      if (target) {
        target.status = 'BATAL';
        target.waktuBatal = wib.toISOString();
        await saveAllAntrean(all);
      }
      return NextResponse.json(
        { success: true, message: 'Antrean berhasil dibatalkan oleh petugas.' },
        { headers: noCacheHeaders }
      );
    }

    return NextResponse.json({ success: false, message: 'Aksi petugas tidak dikenali.' }, { status: 400, headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memproses aksi petugas.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
