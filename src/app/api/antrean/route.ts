import { NextRequest, NextResponse } from 'next/server';
import { bookAntrean, findAntrean, getQueuePosition } from '@/lib/db';
import { validateNIK, validateWhatsApp } from '@/lib/queue-rules';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ success: false, message: 'Parameter query diperlukan' }, { status: 400 });
  }

  const antrean = findAntrean(q);
  if (!antrean) {
    const looksLikeWa = /^[\s\d+-]*$/.test(q) && /^(08|628)\d{8,12}$/.test(q.replace(/[\s-+]/g, ''));
    return NextResponse.json(
      {
        success: false,
        message: looksLikeWa
          ? 'Pencarian dengan nomor WhatsApp sudah tidak didukung. Gunakan NIK atau Kode Tiket Anda.'
          : 'Antrean tidak ditemukan. Pastikan NIK atau Kode Tiket yang dimasukkan benar.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { ...antrean, queuePosition: getQueuePosition(antrean) } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tanggalKunjungan, nik, namaPasien, noWa, tipePendaftar } = body;

    if (!tanggalKunjungan || !nik || !namaPasien || !noWa) {
      return NextResponse.json(
        { success: false, message: 'Seluruh data pendaftaran wajib diisi lengkap.' },
        { status: 400 }
      );
    }

    const nikCheck = validateNIK(nik);
    if (!nikCheck.valid) {
      return NextResponse.json({ success: false, message: nikCheck.message }, { status: 400 });
    }

    const waCheck = validateWhatsApp(noWa);
    if (!waCheck.valid) {
      return NextResponse.json({ success: false, message: waCheck.message }, { status: 400 });
    }

    const result = bookAntrean({
      tanggalKunjungan,
      nik: nik.replace(/\s+/g, ''),
      namaPasien: namaPasien.trim(),
      noWa: noWa.trim(),
      tipePendaftar: tipePendaftar === 'KELUARGA_KADER' ? 'KELUARGA_KADER' : 'MANDIRI',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, data: { ...result.antrean, queuePosition: getQueuePosition(result.antrean!) } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memproses antrean' },
      { status: 500 }
    );
  }
}
