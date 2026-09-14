import { NextResponse } from 'next/server';
import { getOperationalDaysQuota, getStatusPoliHariIni } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kuota = getOperationalDaysQuota();
    const statusPoli = getStatusPoliHariIni();
    return NextResponse.json({
      success: true,
      data: {
        kuota,
        statusPoli
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data kuota' },
      { status: 500 }
    );
  }
}
