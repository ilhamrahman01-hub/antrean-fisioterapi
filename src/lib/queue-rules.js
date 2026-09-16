export const MAX_KUOTA_HARIAN = 10;

export function isOperationalDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 4;
}

export function formatQueueNumber(sequence) {
  return sequence.toString().padStart(2, '0');
}

export function parseSequence(nomorAntrean) {
  const digits = (nomorAntrean || '').replace(/\D/g, '').slice(-2);
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : n;
}

export function getNextSequence(issued) {
  const max = issued.length ? Math.max(...issued) : 0;
  return max + 1;
}

export function validateNIK(nik) {
  const clean = nik.replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, message: 'NIK wajib diisi' };
  }
  if (!/^\d{16}$/.test(clean)) {
    return { valid: false, message: 'NIK harus terdiri dari 16 digit angka' };
  }
  return { valid: true };
}

export function validateWhatsApp(noWa) {
  const clean = noWa.replace(/[\s-+]/g, '');
  if (!clean) {
    return { valid: false, message: 'Nomor WhatsApp wajib diisi' };
  }
  if (!/^(08|628)\d{8,12}$/.test(clean)) {
    return { valid: false, message: 'Format nomor WhatsApp tidak valid (contoh: 081234567890)' };
  }
  return { valid: true };
}

export function maskNIK(nik) {
  if (nik.length !== 16) return nik;
  return `${nik.slice(0, 6)}******${nik.slice(12)}`;
}

export function formatTanggalIndo(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ][date.getMonth()];
  
  return `${hari}, ${day} ${bulan} ${year}`;
}

export function generateKodeTiket(tanggal, nomorAntrean) {
  const cleanDate = tanggal.replace(/-/g, '');
  const seq = parseSequence(nomorAntrean).toString().padStart(2, '0');
  return `PKM-FISIO-${cleanDate}-${seq}`;
}
