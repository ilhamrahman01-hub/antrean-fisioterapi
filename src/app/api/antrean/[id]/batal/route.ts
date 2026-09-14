import { NextRequest, NextResponse } from 'next/server';
import { cancelAntrean } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = cancelAntrean(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pembatalan tiket' },
      { status: 500 }
    );
  }
}
