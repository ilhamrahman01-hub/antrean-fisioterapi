export const MAX_KUOTA_HARIAN = 10;

/**
 * Cek apakah hari adalah hari operasional Poli Fisioterapi (Senin s/d Kamis).
 * Di Javascript Date: 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu.
 */
export function isOperationalDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 4; // Senin (1) s/d Kamis (4)
}

/**
 * Format urutan antrean menjadi kode resmi FISIO-01 s/d FISIO-10.
 */
export function formatQueueNumber(sequence: number): string {
  const padded = sequence.toString().padStart(2, '0');
  return `FISIO-${padded}`;
}

/**
 * Validasi NIK Indonesia (harus 16 digit angka).
 */
export function validateNIK(nik: string): { valid: boolean; message?: string } {
  const clean = nik.replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, message: 'NIK wajib diisi' };
  }
  if (!/^\d{16}$/.test(clean)) {
    return { valid: false, message: 'NIK harus terdiri dari 16 digit angka' };
  }
  return { valid: true };
}

/**
 * Validasi Nomor WhatsApp Indonesia (harus diawali 08 atau 628, panjang 10-15 digit).
 */
export function validateWhatsApp(noWa: string): { valid: boolean; message?: string } {
  const clean = noWa.replace(/[\s-+]/g, '');
  if (!clean) {
    return { valid: false, message: 'Nomor WhatsApp wajib diisi' };
  }
  if (!/^(08|628)\d{8,12}$/.test(clean)) {
    return { valid: false, message: 'Format nomor WhatsApp tidak valid (contoh: 081234567890)' };
  }
  return { valid: true };
}

/**
 * Samarkan NIK untuk privasi publik: 331201******0001
 */
export function maskNIK(nik: string): string {
  if (nik.length !== 16) return nik;
  return `${nik.slice(0, 6)}******${nik.slice(12)}`;
}

/**
 * Format string tanggal YYYY-MM-DD ke Bahasa Indonesia (contoh: Rabu, 6 Nov 2024).
 */
export function formatTanggalIndo(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ][date.getMonth()];
  
  return `${hari}, ${day} ${bulan} ${year}`;
}

/**
 * Generate Kode Tiket Resmi Unik: PKM-FISIO-YYYYMMDD-XX
 */
export function generateKodeTiket(tanggal: string, nomorAntrean: string): string {
  const cleanDate = tanggal.replace(/-/g, '');
  const seq = nomorAntrean.replace('FISIO-', '');
  return `PKM-FISIO-${cleanDate}-${seq}`;
}
