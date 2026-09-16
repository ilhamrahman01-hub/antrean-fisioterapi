import fs from 'fs';
import path from 'path';
import { Antrean, KuotaHari, StatusPoli } from './types';
import {
  formatQueueNumber,
  generateKodeTiket,
  formatTanggalIndo,
  isOperationalDay,
  parseSequence,
  getNextSequence,
  MAX_KUOTA_HARIAN
} from './queue-rules';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'antrean.json');
const POLI_STATE_FILE = path.join(DATA_DIR, 'poli_state.json');

// Helper untuk selalu mendapatkan waktu WIB (meskipun di server Vercel UTC)
export function getWIBDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
}

function normalizeNomor(nomor: string): string {
  const digits = (nomor || '').replace(/\D/g, '').slice(-2);
  const n = parseInt(digits, 10);
  return isNaN(n) ? nomor : n.toString().padStart(2, '0');
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(POLI_STATE_FILE)) {
    const initialState = {
      antreanSekarang: null as string | null,
      ruangan: 'Ruang 103 (Lantai 1)',
      jamLayanan: '08.00 - 12.00 WIB'
    };
    fs.writeFileSync(POLI_STATE_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
  }
}

function getFormattedDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function readAllAntrean(): Antrean[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Antrean[];
    // Migrasi sekali jalan: format lama "FISIO-01" -> "01", kode tiket diselaraskan.
    let migrated = false;
    for (const a of parsed) {
      const fixed = normalizeNomor(a.nomorAntrean);
      if (fixed !== a.nomorAntrean) { a.nomorAntrean = fixed; migrated = true; }
      const expectedKode = generateKodeTiket(a.tanggalKunjungan, a.nomorAntrean);
      if (a.kodeTiket !== expectedKode && a.kodeTiket.startsWith('PKM-FISIO-')) { a.kodeTiket = expectedKode; migrated = true; }
    }
    if (migrated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    return [];
  }
}

export function saveAllAntrean(data: Antrean[]) {
  ensureDataFiles();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getPoliState() {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(POLI_STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed.antreanSekarang === 'string') {
      parsed.antreanSekarang = normalizeNomor(parsed.antreanSekarang);
    }
    return parsed;
  } catch {
    return {
      antreanSekarang: null,
      ruangan: 'Ruang 103',
      jamLayanan: '08.00 - 12.00 WIB'
    };
  }
}

export function setPoliState(newState: Partial<{ antreanSekarang: string | null; ruangan: string; jamLayanan: string }>) {
  ensureDataFiles();
  const current = getPoliState();
  const payload = { ...newState };
  if (typeof payload.antreanSekarang === 'string') {
    payload.antreanSekarang = normalizeNomor(payload.antreanSekarang);
  }
  const updated = { ...current, ...payload };
  fs.writeFileSync(POLI_STATE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

/**
 * Ambil semua antrean untuk satu tanggal, diurut numerik 01-10.
 * Termasuk yang BATAL supaya nomor tidak pernah dipakai ulang.
 */
export function getAntreanByTanggal(tanggal: string): Antrean[] {
  return readAllAntrean()
    .filter(a => a.tanggalKunjungan === tanggal)
    .sort((a, b) => parseSequence(a.nomorAntrean) - parseSequence(b.nomorAntrean));
}

/**
 * Mengambil kuota hari operasional (Senin s/d Kamis) untuk pekan ini dan pekan depan.
 */
export function getOperationalDaysQuota(): KuotaHari[] {
  const allAntrean = readAllAntrean();
  const now = getWIBDate();
  const days: KuotaHari[] = [];

  // Cari 8 hari operasional ke depan (sekitar 2 minggu)
  let checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);

  while (days.length < 6) {
    if (isOperationalDay(checkDate)) {
      const dateStr = getFormattedDate(checkDate);
      const activeAntrean = allAntrean.filter(
        a => a.tanggalKunjungan === dateStr && a.status !== 'BATAL'
      );
      
      const kuotaTerisi = activeAntrean.length;
      const sisaKuota = Math.max(0, MAX_KUOTA_HARIAN - kuotaTerisi);
      
      let status: KuotaHari['status'] = 'TERSEDIA';
      let catatan = 'Peluang antrean masih sangat leluasa';
      let isBisaDaftar = sisaKuota > 0;

      const todayStr = getFormattedDate(now);
      const isPastCutoffToday = (dateStr === todayStr && now.getHours() >= 12);

      if (isPastCutoffToday) {
        status = 'PENUH';
        catatan = 'Pendaftaran ditutup (melewati jam 12:00 WIB)';
        isBisaDaftar = false;
      } else if (sisaKuota === 0) {
        status = 'PENUH';
        catatan = 'Pendaftaran ditutup karena kuota maksimal 10 telah tercapai';
      } else if (sisaKuota <= 3) {
        status = 'SISA_SEDIKIT';
        catatan = `Segera daftar, sisa ${sisaKuota} kuota lagi hari ini!`;
      }

      const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
      days.push({
        tanggal: dateStr,
        namaHari: hariNames[checkDate.getDay()],
        tanggalFormatted: formatTanggalIndo(dateStr),
        kuotaMaksimal: MAX_KUOTA_HARIAN,
        kuotaTerisi,
        sisaKuota,
        status,
        catatan,
        isBisaDaftar
      });
    }
    // Naikkan 1 hari
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return days;
}

/**
 * Reservasi antrean baru dengan garansi atomik kuota maksimal 10.
 */
export function bookAntrean(params: {
  tanggalKunjungan: string;
  nik: string;
  namaPasien: string;
  noWa: string;
  tipePendaftar: Antrean['tipePendaftar'];
}): { success: boolean; antrean?: Antrean; message?: string } {
  const allAntrean = readAllAntrean();

  // 0. Idempotensi double-submit: NIK yang sudah punya tiket AKTIF di tanggal
  // yang sama langsung dikembalikan (bukan error, bukan tiket ganda).
  const existingSameDay = allAntrean.find(
    a => a.tanggalKunjungan === params.tanggalKunjungan && a.nik === params.nik && a.status !== 'BATAL'
  );
  if (existingSameDay) {
    return { success: true, antrean: existingSameDay };
  }

  // 1. Cek batas 1x per minggu (Senin - Minggu)
  const [y, m, d] = params.tanggalKunjungan.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const day = targetDate.getDay(); // 0 = Minggu, 1 = Senin, dst.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const existingThisWeek = allAntrean.find(a => {
    if (a.nik !== params.nik || a.status === 'BATAL') return false;
    const [ay, am, ad] = a.tanggalKunjungan.split('-').map(Number);
    const aDate = new Date(ay, am - 1, ad);
    return aDate >= monday && aDate <= sunday;
  });

  if (existingThisWeek) {
    return {
      success: false,
      message: `Mohon maaf, NIK ${params.nik} sudah terdaftar untuk sesi Fisioterapi minggu ini pada tanggal ${formatTanggalIndo(existingThisWeek.tanggalKunjungan)}. Sesuai aturan, 1 Pasien hanya bisa mendaftar 1 kali dalam sepekan (Senin-Minggu).`
    };
  }

  // 2. Hitung kuota yang sudah terisi di tanggal tersebut (BATAL tidak dihitung)
  const dayList = allAntrean.filter(
    a => a.tanggalKunjungan === params.tanggalKunjungan
  );
  const activeCount = dayList.filter(a => a.status !== 'BATAL').length;

  if (activeCount >= MAX_KUOTA_HARIAN) {
    return {
      success: false,
      message: `Mohon maaf, kuota untuk ${formatTanggalIndo(params.tanggalKunjungan)} sudah PENUH (Maksimal 10 pasien). Silakan pilih hari lain.`
    };
  }

  // 3. Nomor selalu naik monotonik: max semua nomor yang pernah diterbitkan + 1.
  // Slot yang dibatalkan hangus (tidak dipakai ulang) sehingga tidak ada nomor kembar.
  const nextSequence = getNextSequence(dayList.map(a => parseSequence(a.nomorAntrean)));
  if (nextSequence > MAX_KUOTA_HARIAN) {
    return {
      success: false,
      message: `Mohon maaf, nomor antrean untuk ${formatTanggalIndo(params.tanggalKunjungan)} sudah habis (maksimal 10 nomor per hari).`
    };
  }
  const nomorAntrean = formatQueueNumber(nextSequence);
  const kodeTiket = generateKodeTiket(params.tanggalKunjungan, nomorAntrean);

  const newAntrean: Antrean = {
    id: `antrean-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nomorAntrean,
    kodeTiket,
    tanggalKunjungan: params.tanggalKunjungan,
    nik: params.nik,
    namaPasien: params.namaPasien,
    noWa: params.noWa,
    tipePendaftar: params.tipePendaftar,
    status: 'MENUNGGU',
    waktuDaftar: getWIBDate().toISOString()
  };

  allAntrean.push(newAntrean);
  saveAllAntrean(allAntrean);

  return {
    success: true,
    antrean: newAntrean
  };
}

/**
 * Pembatalan antrean mandiri oleh pasien (kuota aktif berkurang 1,
 * tetapi nomor yang dibatalkan hangus dan tidak diterbitkan ulang).
 */
export function cancelAntrean(idOrKodeTiket: string): { success: boolean; message: string } {
  const allAntrean = readAllAntrean();
  const index = allAntrean.findIndex(
    a => a.id === idOrKodeTiket || a.kodeTiket === idOrKodeTiket
  );

  if (index === -1) {
    return { success: false, message: 'Data tiket antrean tidak ditemukan.' };
  }

  if (allAntrean[index].status === 'BATAL') {
    return { success: false, message: 'Tiket antrean ini sudah pernah dibatalkan.' };
  }

  allAntrean[index].status = 'BATAL';
  saveAllAntrean(allAntrean);

  return {
    success: true,
    message: `Antrean ${allAntrean[index].nomorAntrean} berhasil dibatalkan. Kuota telah dikembalikan untuk pasien lain.`
  };
}

/**
 * Cari antrean berdasarkan ID, Kode Tiket, atau NIK.
 * Sengaja TIDAK mencari by nomor antrean (01-10 berulang tiap hari,
 * rawan kena tiket orang lain) dan TIDAK by nomor WA (bukan identitas unik).
 * Untuk NIK yang punya banyak tiket, kembalikan yang terbaru dan belum BATAL.
 */
export function findAntrean(query: string): Antrean | null {
  const clean = query.trim();
  if (!clean) return null;
  const allAntrean = readAllAntrean();

  const byIdOrKode = allAntrean.find(
    a => a.id === clean || a.kodeTiket === clean
  );
  if (byIdOrKode) return byIdOrKode;

  // Nomor WA bukan kunci pencarian yang valid (bisa berubah / dipakai bersama).
  const digitsOnly = clean.replace(/\D/g, '');
  if (/^(08|628)\d{8,12}$/.test(clean.replace(/[\s-+]/g, ''))) {
    return null;
  }

  const byNik = allAntrean
    .filter(a => a.nik === clean || a.nik === digitsOnly)
    .sort((a, b) => b.waktuDaftar.localeCompare(a.waktuDaftar));
  if (!byNik.length) return null;
  return byNik.find(a => a.status !== 'BATAL') || byNik[0];
}

/**
 * Urutan antrean pasien pada tanggal kunjungannya (1-based),
 * dihitung dari posisi waktuDaftar di antara tiket aktif hari itu.
 */
export function getQueuePosition(antrean: Antrean): number {
  const dayActive = readAllAntrean()
    .filter(a => a.tanggalKunjungan === antrean.tanggalKunjungan && a.status !== 'BATAL')
    .sort((a, b) => a.waktuDaftar.localeCompare(b.waktuDaftar));
  const idx = dayActive.findIndex(a => a.id === antrean.id);
  return idx === -1 ? 0 : idx + 1;
}

/**
 * Status antrean poli hari ini untuk live monitor & TV.
 */
export function getStatusPoliHariIni(): StatusPoli {
  const todayStr = getFormattedDate(getWIBDate());
  const allAntrean = readAllAntrean();
  const poliState = getPoliState();

  const todayAntrean = allAntrean.filter(
    a => a.tanggalKunjungan === todayStr && a.status !== 'BATAL'
  );

  const sisaMenunggu = todayAntrean.filter(a => a.status === 'MENUNGGU').length;

  return {
    poliName: 'Poli Fisioterapi',
    ruangan: poliState.ruangan,
    antreanSekarang: poliState.antreanSekarang,
    totalHariIni: todayAntrean.length,
    sisaMenunggu,
    jamLayanan: poliState.jamLayanan
  };
}
