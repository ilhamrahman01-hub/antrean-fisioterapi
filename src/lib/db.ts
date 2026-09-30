import fs from 'fs';
import path from 'path';
import { put, get } from '@vercel/blob';
import { Antrean, KuotaHari, StatusPoli } from './types';
import {
  formatQueueNumber,
  generateKodeTiket,
  formatTanggalIndo,
  isOperationalDay,
  parseSequence,
  MAX_KUOTA_HARIAN
} from './queue-rules';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'antrean.json');
const POLI_STATE_FILE = path.join(DATA_DIR, 'poli_state.json');

// Memory cache untuk mempercepat request beruntun dalam 1 lambda lifecycle
let memoryAntrean: Antrean[] | null = null;
let memoryAntreanTime = 0;
let memoryPoliState: any = null;
let memoryPoliTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 detik TTL untuk read cache

/**
 * Helper untuk mendapatkan waktu WIB (UTC+7)
 */
export function getWIBDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
}

function getFormattedDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ensureLocalDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

/**
 * Membaca seluruh data antrean.
 * Prioritas: Vercel Blob Storage jika token tersedia, fallback ke local file.
 */
export async function readAllAntrean(): Promise<Antrean[]> {
  const now = Date.now();
  if (memoryAntrean && (now - memoryAntreanTime < CACHE_TTL_MS)) {
    return memoryAntrean;
  }

  // 1. Coba baca dari Vercel Blob jika token tersedia
  if (BLOB_TOKEN) {
    try {
      // Ambil blob dari URL tetap antrean.json di private store
      const blobRes = await get('antrean.json', {
        access: 'private',
        token: BLOB_TOKEN
      });

      if (blobRes && blobRes.stream) {
        const text = await new Response(blobRes.stream).text();
        const parsed = JSON.parse(text) as Antrean[];
        memoryAntrean = parsed;
        memoryAntreanTime = now;
        return parsed;
      }
    } catch (blobErr: any) {
      // Jika blob belum ada (404), lanjutkan fallback ke local / initial
      if (blobErr?.status !== 404 && blobErr?.message?.indexOf('404') === -1) {
        console.warn('Vercel Blob read warning:', blobErr?.message || blobErr);
      }
    }
  }

  // 2. Fallback ke disk lokal
  ensureLocalDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Antrean[];
      memoryAntrean = parsed;
      memoryAntreanTime = now;
      return parsed;
    }
  } catch (err) {
    console.error('Local file read error:', err);
  }

  memoryAntrean = [];
  memoryAntreanTime = now;
  return [];
}

/**
 * Menyimpan seluruh data antrean.
 * Menyimpan ke Vercel Blob (persisten global) & local mirror.
 */
export async function saveAllAntrean(data: Antrean[]): Promise<void> {
  memoryAntrean = data;
  memoryAntreanTime = Date.now();

  // Simpan ke local disk
  ensureLocalDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}

  // Simpan ke Vercel Blob jika token tersedia
  if (BLOB_TOKEN) {
    try {
      await put('antrean.json', JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        token: BLOB_TOKEN
      });
    } catch (err) {
      console.error('Vercel Blob save error:', err);
    }
  }
}

/**
 * Membaca state poli saat ini
 */
export async function getPoliState(): Promise<{ antreanSekarang: string | null; ruangan: string; jamLayanan: string }> {
  const now = Date.now();
  if (memoryPoliState && (now - memoryPoliTime < CACHE_TTL_MS)) {
    return memoryPoliState;
  }

  const defaultState = {
    antreanSekarang: null as string | null,
    ruangan: 'Ruang 103 (Lantai 1)',
    jamLayanan: '08.00 - 12.00 WIB'
  };

  if (BLOB_TOKEN) {
    try {
      const blobRes = await get('poli_state.json', {
        access: 'private',
        token: BLOB_TOKEN
      });
      if (blobRes && blobRes.stream) {
        const text = await new Response(blobRes.stream).text();
        const parsed = JSON.parse(text);
        memoryPoliState = parsed;
        memoryPoliTime = now;
        return parsed;
      }
    } catch {}
  }

  ensureLocalDir();
  try {
    if (fs.existsSync(POLI_STATE_FILE)) {
      const raw = fs.readFileSync(POLI_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryPoliState = parsed;
      memoryPoliTime = now;
      return parsed;
    }
  } catch {}

  memoryPoliState = defaultState;
  memoryPoliTime = now;
  return defaultState;
}

/**
 * Mengubah state poli
 */
export async function setPoliState(newState: Partial<{ antreanSekarang: string | null; ruangan: string; jamLayanan: string }>) {
  const current = await getPoliState();
  const updated = { ...current, ...newState };
  memoryPoliState = updated;
  memoryPoliTime = Date.now();

  ensureLocalDir();
  try {
    fs.writeFileSync(POLI_STATE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {}

  if (BLOB_TOKEN) {
    try {
      await put('poli_state.json', JSON.stringify(updated), {
        access: 'private',
        addRandomSuffix: false,
        token: BLOB_TOKEN
      });
    } catch (err) {
      console.error('Vercel Blob poli state error:', err);
    }
  }

  return updated;
}

/**
 * Ambil semua antrean untuk satu tanggal, diurutkan waktu daftar
 */
export async function getAntreanByTanggal(tanggal: string): Promise<Antrean[]> {
  const all = await readAllAntrean();
  return all
    .filter(a => a.tanggalKunjungan === tanggal)
    .sort((a, b) => a.waktuDaftar.localeCompare(b.waktuDaftar));
}

/**
 * Mengambil kuota hari operasional (Senin s/d Kamis) untuk pekan ini dan pekan depan.
 */
export async function getOperationalDaysQuota(): Promise<KuotaHari[]> {
  const allAntrean = await readAllAntrean();
  const now = getWIBDate();
  const days: KuotaHari[] = [];

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
      let catatan = `Tersedia ${sisaKuota} kuota pasien`;
      let isBisaDaftar = sisaKuota > 0;

      const todayStr = getFormattedDate(now);
      const isPastCutoffToday = (dateStr === todayStr && now.getHours() >= 12);

      if (isPastCutoffToday) {
        status = 'PENUH';
        catatan = 'Pendaftaran ditutup (melewati jam 12:00 WIB)';
        isBisaDaftar = false;
      } else if (sisaKuota === 0) {
        status = 'PENUH';
        catatan = 'Pendaftaran ditutup karena kuota maksimal 10 pasien telah tercapai';
        isBisaDaftar = false;
      } else if (sisaKuota <= 3) {
        status = 'SISA_SEDIKIT';
        catatan = `Sisa sedikit: ${sisaKuota} kuota lagi hari ini!`;
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
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return days;
}

/**
 * Reservasi antrean baru dengan garansi kuota maksimal 10 pasien.
 * Menghilangkan bug off-by-one dan memastikan pasien ke-9 & ke-10 bisa daftar.
 */
export async function bookAntrean(params: {
  tanggalKunjungan: string;
  nik: string;
  namaPasien: string;
  noWa: string;
  tipePendaftar: Antrean['tipePendaftar'];
}): Promise<{ success: boolean; antrean?: Antrean; message?: string }> {
  const allAntrean = await readAllAntrean();
  const cleanNik = params.nik.replace(/\D/g, '');

  // 0. Idempotensi double-submit: NIK yang sudah punya tiket AKTIF di tanggal
  // yang sama langsung dikembalikan (bukan error, bukan tiket ganda).
  const existingSameDay = allAntrean.find(
    a => a.tanggalKunjungan === params.tanggalKunjungan && a.nik === cleanNik && a.status !== 'BATAL'
  );
  if (existingSameDay) {
    return { success: true, antrean: existingSameDay };
  }

  // 1. Cek batas 1x per minggu (Senin - Minggu)
  const [y, m, d] = params.tanggalKunjungan.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const day = targetDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const existingThisWeek = allAntrean.find(a => {
    if (a.nik !== cleanNik || a.status === 'BATAL') return false;
    const [ay, am, ad] = a.tanggalKunjungan.split('-').map(Number);
    const aDate = new Date(ay, am - 1, ad);
    return aDate >= monday && aDate <= sunday;
  });

  if (existingThisWeek) {
    return {
      success: false,
      message: `Mohon maaf, NIK ${cleanNik} sudah terdaftar untuk sesi Fisioterapi pekan ini pada tanggal ${formatTanggalIndo(existingThisWeek.tanggalKunjungan)}. Sesuai aturan, 1 Pasien hanya bisa mendaftar 1 kali dalam sepekan (Senin-Minggu).`
    };
  }

  // 2. Hitung kuota aktif pada hari tersebut (status BATAL tidak dihitung)
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

  // 3. Alokasi slot: slot nomor urut 01-10 berdasarkan kuota terisi aktif + 1
  const slotNumber = formatQueueNumber(activeCount + 1);
  const kodeTiket = generateKodeTiket(params.tanggalKunjungan, slotNumber);

  const newAntrean: Antrean = {
    id: `antrean-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nomorAntrean: slotNumber,
    kodeTiket,
    tanggalKunjungan: params.tanggalKunjungan,
    nik: cleanNik,
    namaPasien: params.namaPasien.trim(),
    noWa: params.noWa.trim(),
    tipePendaftar: params.tipePendaftar,
    status: 'MENUNGGU',
    waktuDaftar: getWIBDate().toISOString()
  };

  allAntrean.push(newAntrean);
  await saveAllAntrean(allAntrean);

  return {
    success: true,
    antrean: newAntrean
  };
}

/**
 * Pembatalan antrean mandiri oleh pasien
 */
export async function cancelAntrean(idOrKodeTiket: string): Promise<{ success: boolean; message: string; antrean?: Antrean }> {
  const allAntrean = await readAllAntrean();
  const clean = idOrKodeTiket.trim();
  const index = allAntrean.findIndex(
    a => a.id === clean || a.kodeTiket.toUpperCase() === clean.toUpperCase()
  );

  if (index === -1) {
    return { success: false, message: 'Data tiket antrean tidak ditemukan.' };
  }

  if (allAntrean[index].status === 'BATAL') {
    return { success: false, message: 'Tiket antrean ini sudah pernah dibatalkan sebelumnya.', antrean: allAntrean[index] };
  }

  allAntrean[index].status = 'BATAL';
  allAntrean[index].waktuBatal = getWIBDate().toISOString();
  await saveAllAntrean(allAntrean);

  return {
    success: true,
    message: `Antrean dengan Kode Tiket ${allAntrean[index].kodeTiket} berhasil dibatalkan. Kuota telah dikembalikan untuk pasien lain.`,
    antrean: allAntrean[index]
  };
}

/**
 * Cari antrean berdasarkan ID, Kode Tiket, atau NIK.
 */
export async function findAntrean(query: string): Promise<Antrean | null> {
  const clean = query.trim();
  if (!clean) return null;
  const allAntrean = await readAllAntrean();

  // 1. Cari by ID atau Kode Tiket (case-insensitive)
  const byIdOrKode = allAntrean.find(
    a => a.id === clean || a.kodeTiket.toUpperCase() === clean.toUpperCase()
  );
  if (byIdOrKode) return byIdOrKode;

  // 2. Cari by NIK (16 digit angka)
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const byNik = allAntrean
      .filter(a => a.nik === digitsOnly || a.nik === clean)
      .sort((a, b) => b.waktuDaftar.localeCompare(a.waktuDaftar));

    if (byNik.length > 0) {
      // Prioritaskan tiket yang aktif (belum batal)
      return byNik.find(a => a.status !== 'BATAL') || byNik[0];
    }
  }

  return null;
}

/**
 * Menghitung urutan pendaftaran aktif pada hari kunjungan
 */
export async function getQueuePosition(antrean: Antrean): Promise<number> {
  const allAntrean = await readAllAntrean();
  const dayActive = allAntrean
    .filter(a => a.tanggalKunjungan === antrean.tanggalKunjungan && a.status !== 'BATAL')
    .sort((a, b) => a.waktuDaftar.localeCompare(b.waktuDaftar));
  const idx = dayActive.findIndex(a => a.id === antrean.id);
  return idx === -1 ? 0 : idx + 1;
}

/**
 * Status antrean poli hari ini
 */
export async function getStatusPoliHariIni(): Promise<StatusPoli> {
  const todayStr = getFormattedDate(getWIBDate());
  const allAntrean = await readAllAntrean();
  const poliState = await getPoliState();

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
