import { NextRequest, NextResponse } from 'next/server';
import { cancelAntrean } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID Tiket diperlukan.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = await cancelAntrean(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.antrean
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pembatalan tiket antrean.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
