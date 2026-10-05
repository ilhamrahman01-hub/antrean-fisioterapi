export type TipePendaftar = 'MANDIRI' | 'KELUARGA_KADER';

export type JalurPendaftaran = 'ONLINE' | 'OFFLINE';

export type StatusAntrean = 'MENUNGGU' | 'DIPANGGIL' | 'SELESAI' | 'BATAL' | 'TIDAK_HADIR';

export interface Antrean {
  id: string;
  nomorAntrean: string; // e.g. "01" (penanda slot internal)
  kodeTiket: string;    // e.g. "PKM-FISIO-20261001-01"
  tanggalKunjungan: string; // "YYYY-MM-DD"
  nik: string;          // 16 digits
  namaPasien: string;
  noWa: string;
  tipePendaftar: TipePendaftar;
  jalur?: JalurPendaftaran; // 'ONLINE' (default) atau 'OFFLINE' (loket)
  status: StatusAntrean;
  waktuDaftar: string;  // ISO string
  waktuDipanggil?: string;
  waktuSelesai?: string;
  waktuBatal?: string;
}

export interface KuotaHari {
  tanggal: string;      // "YYYY-MM-DD"
  namaHari: string;     // "Senin", "Selasa", dll
  tanggalFormatted: string; // "24 Maret 2025"
  kuotaMaksimal: number; // 10
  kuotaTerisi: number;
  sisaKuota: number;
  kuotaOnlineMaksimal: number; // 6
  kuotaOnlineTerisi: number;
  sisaKuotaOnline: number;
  kuotaOfflineMaksimal: number; // 4
  kuotaOfflineTerisi: number;
  sisaKuotaOffline: number;
  status: 'PENUH' | 'SISA_SEDIKIT' | 'TERSEDIA' | 'TUTUP';
  catatan?: string;
  isBisaDaftar: boolean; // Khusus pendaftaran online pasien
}

export interface StatusPoli {
  poliName: string;
  ruangan: string;
  antreanSekarang: string | null;
  totalHariIni: number;
  sisaMenunggu: number;
  jamLayanan: string;
}
