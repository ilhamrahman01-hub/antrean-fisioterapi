import { NextRequest, NextResponse } from 'next/server';
import { bookAntrean, findAntrean, getQueuePosition } from '@/lib/db';
import { validateNIK, validateWhatsApp } from '@/lib/queue-rules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json(
        { success: false, message: 'Parameter query diperlukan (masukkan NIK atau Kode Tiket).' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const antrean = await findAntrean(q);
    if (!antrean) {
      const looksLikeWa = /^[\s\d+-]*$/.test(q) && /^(08|628)\d{8,12}$/.test(q.replace(/[\s-+]/g, ''));
      return NextResponse.json(
        {
          success: false,
          message: looksLikeWa
            ? 'Pencarian dengan nomor WhatsApp tidak didukung. Silakan gunakan NIK (16 digit) atau Kode Tiket Anda.'
            : 'Data karcis antrean tidak ditemukan. Pastikan nomor NIK atau Kode Tiket yang dimasukkan benar.',
        },
        { status: 404, headers: noCacheHeaders }
      );
    }

    const queuePosition = await getQueuePosition(antrean);

    return NextResponse.json(
      { success: true, data: { ...antrean, queuePosition } },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    console.error('Error in GET /api/antrean:', err);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mencari karcis antrean.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tanggalKunjungan, nik, namaPasien, noWa, tipePendaftar } = body;

    if (!tanggalKunjungan || !nik || !namaPasien || !noWa) {
      return NextResponse.json(
        { success: false, message: 'Seluruh data pendaftaran wajib diisi lengkap.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const nikCheck = validateNIK(nik);
    if (!nikCheck.valid) {
      return NextResponse.json(
        { success: false, message: nikCheck.message },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const waCheck = validateWhatsApp(noWa);
    if (!waCheck.valid) {
      return NextResponse.json(
        { success: false, message: waCheck.message },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const result = await bookAntrean({
      tanggalKunjungan,
      nik: nik.replace(/\s+/g, ''),
      namaPasien: namaPasien.trim(),
      noWa: noWa.trim(),
      tipePendaftar: tipePendaftar === 'KELUARGA_KADER' ? 'KELUARGA_KADER' : 'MANDIRI',
    });

    if (!result.success || !result.antrean) {
      return NextResponse.json(
        { success: false, message: result.message || 'Gagal mendaftar antrean' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const queuePosition = await getQueuePosition(result.antrean);

    return NextResponse.json(
      { success: true, data: { ...result.antrean, queuePosition } },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memproses antrean. Silakan coba kembali.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
