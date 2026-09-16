export type TipePendaftar = 'MANDIRI' | 'KELUARGA_KADER';

export type StatusAntrean = 'MENUNGGU' | 'DIPANGGIL' | 'SELESAI' | 'BATAL' | 'TIDAK_HADIR';

export interface Antrean {
  id: string;
  nomorAntrean: string; // e.g. "01"
  kodeTiket: string;    // e.g. "PKM-FISIO-20260917-06"
  tanggalKunjungan: string; // "YYYY-MM-DD"
  nik: string;          // 16 digits
  namaPasien: string;
  noWa: string;
  tipePendaftar: TipePendaftar;
  status: StatusAntrean;
  waktuDaftar: string;  // ISO string
  waktuDipanggil?: string;
  waktuSelesai?: string;
}

export interface KuotaHari {
  tanggal: string;      // "YYYY-MM-DD"
  namaHari: string;     // "Senin", "Selasa", dll
  tanggalFormatted: string; // "24 Maret 2025"
  kuotaMaksimal: number; // 10
  kuotaTerisi: number;
  sisaKuota: number;
  status: 'PENUH' | 'SISA_SEDIKIT' | 'TERSEDIA' | 'TUTUP';
  catatan?: string;
  isBisaDaftar: boolean;
}

export interface StatusPoli {
  poliName: string;
  ruangan: string;
  antreanSekarang: string | null; // e.g. "04"
  totalHariIni: number;
  sisaMenunggu: number;
  jamLayanan: string;
}
