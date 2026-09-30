import { NextResponse } from 'next/server';
import { getOperationalDaysQuota, getStatusPoliHariIni } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

export async function GET() {
  try {
    const kuota = await getOperationalDaysQuota();
    const statusPoli = await getStatusPoliHariIni();

    return NextResponse.json(
      {
        success: true,
        data: {
          kuota,
          statusPoli
        }
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data kuota antrean.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
