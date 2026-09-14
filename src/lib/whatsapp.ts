import { Antrean } from './types';
import { formatTanggalIndo, maskNIK } from './queue-rules';

/**
 * Buat tautan WhatsApp resmi untuk pengiriman karcis antrean (100% Gratis via wa.me)
 */
export function generateWhatsAppLink(antrean: Antrean, baseUrl?: string): string {
  const host = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://antrean.puskesmas.id');
  const ticketUrl = `${host}/tiket/${antrean.id}`;

  const message = 
`*KONFIRMASI ANTREAN POLI FISIOTERAPI*
*PUSKESMAS PRACIMANTORO 1*

Halo Bpk/Ibu *${antrean.namaPasien}*,
Pendaftaran antrean fisioterapi Anda telah *TERKONFIRMASI RESMI*.

📋 *Nomor Antrean:* ${antrean.nomorAntrean}
📅 *Hari/Tanggal:* ${formatTanggalIndo(antrean.tanggalKunjungan)}
⏰ *Jam Layanan:* 08.00 - 12.00 WIB
📍 *Lokasi:* Poli Fisioterapi (Ruang 103)
👤 *NIK Pasien:* ${maskNIK(antrean.nik)}
🔖 *Kode Tiket:* ${antrean.kodeTiket}

*Pantau Antrean Real-time & Lihat Karcis Digital:*
👉 ${ticketUrl}

---------------------------------------
⚠️ *Catatan Kedatangan:*
1. Hadir 10–15 menit sebelum giliran dengan membawa KTP & kartu BPJS asli.
2. Kenakan pakaian nyaman/elastis untuk terapi fisik.
3. Tunjukkan karcis digital atau QR code ini ke petugas loket.
4. Jika berhalangan hadir, silakan buka link di atas untuk membatalkan antrean agar kuota dapat digunakan pasien lain yang membutuhkan.`;

  const cleanPhone = antrean.noWa.replace(/[\s-+]/g, '');
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0')) {
    formattedPhone = '62' + cleanPhone.slice(1);
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
