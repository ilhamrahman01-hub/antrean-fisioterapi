import { Antrean } from './types';
import { formatTanggalIndo, maskNIK } from './queue-rules';

/**
 * Mendapatkan origin website secara aman dan dinamis
 */
export function getBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl) return explicitBaseUrl;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://antrean-fisioterapi.vercel.app';
}

/**
 * Buat tautan WhatsApp resmi konfirmasi pendaftaran antrean
 * Teks singkat, padat, menyertakan KODE TIKET, tanpa barcode, dan link 100% valid.
 */
export function generateWhatsAppLink(antrean: Antrean, baseUrl?: string): string {
  const host = getBaseUrl(baseUrl);
  const ticketUrl = `${host}/tiket/${antrean.id}`;

  const message = 
`*BUKTI ANTREAN POLI FISIOTERAPI*
*PUSKESMAS PRACIMANTORO 1*

Halo Bpk/Ibu *${antrean.namaPasien}*,
Pendaftaran antrean fisioterapi Anda telah *TERCATAT*.

🔖 *KODE TIKET:* ${antrean.kodeTiket}
📅 *Hari/Tanggal:* ${formatTanggalIndo(antrean.tanggalKunjungan)}
⏰ *Jam Layanan:* 08.00 - 12.00 WIB
📍 *Lokasi:* Poli Fisioterapi (Ruang 103)
👤 *NIK Pasien:* ${maskNIK(antrean.nik)}

ℹ️ *Informasi Layanan:*
• Kuota harian Anda telah terjamin (maksimal 10 pasien/hari).
• Pelayanan dilayani sesuai urutan kedatangan di ruang poli (siapa cepat datang, dilayani duluan).
• Harap hadir membawa KTP & kartu BPJS asli.

🔗 *Lihat Bukti Karcis Digital:*
${ticketUrl}`;

  const cleanPhone = (antrean.noWa || '').replace(/[\s-+]/g, '');
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0')) {
    formattedPhone = '62' + cleanPhone.slice(1);
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Buat tautan WhatsApp konfirmasi pembatalan antrean
 */
export function generateWhatsAppCancelLink(antrean: Antrean, baseUrl?: string): string {
  const message =
`*PEMBERITAHUAN PEMBATALAN ANTREAN*
*PUSKESMAS PRACIMANTORO 1*

Halo Bpk/Ibu *${antrean.namaPasien}*,
Reservasi antrean Poli Fisioterapi Anda untuk jadwal:
📅 *${formatTanggalIndo(antrean.tanggalKunjungan)}*
🔖 *Kode Tiket:* ${antrean.kodeTiket}

Telah *BERHASIL DIBATALKAN*. Kuota telah dikembalikan ke sistem untuk pasien lain yang membutuhkan.

Terima kasih atas informasinya.`;

  const cleanPhone = (antrean.noWa || '').replace(/[\s-+]/g, '');
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0')) {
    formattedPhone = '62' + cleanPhone.slice(1);
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Buat tautan WhatsApp pengingat H-1 jadwal kunjungan antrean
 */
export function generateWhatsAppReminderH1Link(antrean: Antrean, baseUrl?: string): string {
  const host = getBaseUrl(baseUrl);
  const ticketUrl = `${host}/tiket/${antrean.id}`;

  const message =
`*PENGINGAT KUNJUNGAN POLI FISIOTERAPI (H-1)*
*PUSKESMAS PRACIMANTORO 1*

Halo Bpk/Ibu *${antrean.namaPasien}*,
Mengingatkan kembali reservasi sesi Fisioterapi Anda untuk besok:

📅 *Hari/Tanggal:* ${formatTanggalIndo(antrean.tanggalKunjungan)}
⏰ *Jam Layanan:* 08.00 - 12.00 WIB
📍 *Lokasi:* Poli Fisioterapi (Ruang 103)
🔖 *Kode Tiket:* ${antrean.kodeTiket}

ℹ️ *Petunjuk Kehadiran:*
• Pelayanan dilayani berdasarkan urutan kedatangan di ruang poli (First Come, First Served).
• Harap hadir tepat waktu dengan membawa KTP & kartu BPJS asli.
• Jika berhalangan hadir, mohon batalkan antrean melalui tautan karcis digital agar kuota dapat digunakan oleh pasien lain yang membutuhkan.

🔗 *Karcis Digital:*
${ticketUrl}

Terima kasih.`;

  const cleanPhone = (antrean.noWa || '').replace(/[\s-+]/g, '');
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0')) {
    formattedPhone = '62' + cleanPhone.slice(1);
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

