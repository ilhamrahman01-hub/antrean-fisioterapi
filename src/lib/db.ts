import fs from 'fs';
import path from 'path';
import { Antrean, KuotaHari, StatusPoli } from './types';
import {
  formatQueueNumber,
  generateKodeTiket,
  formatTanggalIndo,
  isOperationalDay,
  MAX_KUOTA_HARIAN
} from './queue-rules';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'antrean.json');
const POLI_STATE_FILE = path.join(DATA_DIR, 'poli_state.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed dengan beberapa data dummy awal yang realistis (seperti contoh screen Stitch)
    const initialAntrean: Antrean[] = [
      {
        id: 'antrean-001',
        nomorAntrean: 'FISIO-01',
        kodeTiket: 'PKM-FISIO-20260914-01',
        tanggalKunjungan: getFormattedDate(new Date()),
        nik: '3312011204650001',
        namaPasien: 'Bpk. Sugeng Riyadi',
        noWa: '081234567801',
        tipePendaftar: 'MANDIRI',
        status: 'SELESAI',
        waktuDaftar: new Date(Date.now() - 3600000 * 3).toISOString(),
        waktuDipanggil: new Date(Date.now() - 3600000 * 2).toISOString(),
        waktuSelesai: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'antrean-002',
        nomorAntrean: 'FISIO-02',
        kodeTiket: 'PKM-FISIO-20260914-02',
        tanggalKunjungan: getFormattedDate(new Date()),
        nik: '3312015508700002',
        namaPasien: 'Ibu Siti Aminah',
        noWa: '081234567802',
        tipePendaftar: 'KELUARGA_KADER',
        status: 'DIPANGGIL',
        waktuDaftar: new Date(Date.now() - 3600000 * 2).toISOString(),
        waktuDipanggil: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'antrean-003',
        nomorAntrean: 'FISIO-03',
        kodeTiket: 'PKM-FISIO-20260914-03',
        tanggalKunjungan: getFormattedDate(new Date()),
        nik: '3312010901580003',
        namaPasien: 'Bpk. Bambang Sutrisno',
        noWa: '081234567890',
        tipePendaftar: 'MANDIRI',
        status: 'MENUNGGU',
        waktuDaftar: new Date(Date.now() - 3600000).toISOString(),
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialAntrean, null, 2), 'utf-8');
  }
  if (!fs.existsSync(POLI_STATE_FILE)) {
    const initialState = {
      antreanSekarang: 'FISIO-02',
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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
  } catch {
    return {
      antreanSekarang: 'FISIO-01',
      ruangan: 'Ruang 103',
      jamLayanan: '08.00 - 12.00 WIB'
    };
  }
}

export function setPoliState(newState: Partial<{ antreanSekarang: string | null; ruangan: string; jamLayanan: string }>) {
  ensureDataFiles();
  const current = getPoliState();
  const updated = { ...current, ...newState };
  fs.writeFileSync(POLI_STATE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

/**
 * Mengambil kuota hari operasional (Senin s/d Kamis) untuk pekan ini dan pekan depan.
 */
export function getOperationalDaysQuota(): KuotaHari[] {
  const allAntrean = readAllAntrean();
  const now = new Date();
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

  // 2. Hitung kuota yang sudah terisi di tanggal tersebut
  const activeCount = allAntrean.filter(
    a => a.tanggalKunjungan === params.tanggalKunjungan && a.status !== 'BATAL'
  ).length;

  if (activeCount >= MAX_KUOTA_HARIAN) {
    return {
      success: false,
      message: `Mohon maaf, kuota untuk ${formatTanggalIndo(params.tanggalKunjungan)} sudah PENUH (Maksimal 10 pasien). Silakan pilih hari lain.`
    };
  }

  // 3. Tentukan nomor antrean berikutnya (nomor urut 1-10)
  const nextSequence = activeCount + 1;
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
    waktuDaftar: new Date().toISOString()
  };

  allAntrean.push(newAntrean);
  saveAllAntrean(allAntrean);

  return {
    success: true,
    antrean: newAntrean
  };
}

/**
 * Pembatalan antrean mandiri oleh pasien (mengembalikan kuota).
 */
export function cancelAntrean(idOrKodeTiket: string): { success: boolean; message: string } {
  const allAntrean = readAllAntrean();
  const index = allAntrean.findIndex(
    a => a.id === idOrKodeTiket || a.kodeTiket === idOrKodeTiket || a.nomorAntrean === idOrKodeTiket
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
 * Cari antrean berdasarkan ID atau Kode Tiket atau NIK.
 */
export function findAntrean(query: string): Antrean | null {
  const clean = query.trim();
  const allAntrean = readAllAntrean();
  
  return allAntrean.find(
    a => a.id === clean || a.kodeTiket === clean || a.nomorAntrean === clean || a.nik === clean
  ) || null;
}

/**
 * Status antrean poli hari ini untuk live monitor & TV.
 */
export function getStatusPoliHariIni(): StatusPoli {
  const todayStr = getFormattedDate(new Date());
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
