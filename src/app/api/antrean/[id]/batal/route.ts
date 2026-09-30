import { NextRequest, NextResponse } from 'next/server';
import { cancelAntrean } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    let id = resolvedParams?.id;
    
    if (!id) {
      const segments = req.nextUrl.pathname.split('/');
      const batalIdx = segments.indexOf('batal');
      if (batalIdx > 0) {
        id = decodeURIComponent(segments[batalIdx - 1]);
      }
    }

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || body?.kodeTiket;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID atau Kode Tiket diperlukan.' },
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
