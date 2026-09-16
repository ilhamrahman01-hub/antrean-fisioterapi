/**
 * Web Audio API synthesizer bel antrean rumah sakit / puskesmas ("Ding - Dong")
 * Berjalan murni di browser tanpa perlu mengunduh file MP3 eksternal.
 */
export function playChimeBell() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;

    // Nada 1 (Ding: Frekuensi 659 Hz / E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Nada 2 (Dong: Frekuensi 523 Hz / C5) setelah 0.4 detik
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.4);
    gain2.gain.setValueAtTime(0.5, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.4);
    osc2.stop(now + 1.4);
  } catch (err) {
    console.warn('AudioContext tidak didukung atau diblokir browser:', err);
  }
}

/**
 * Text-to-Speech pemanggilan nomor antrean dalam Bahasa Indonesia
 */
export function speakQueueNumber(nomorAntrean: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Bunyikan bel ding-dong terlebih dahulu
  playChimeBell();

  setTimeout(() => {
    const digits = (nomorAntrean || '').replace(/\D/g, '').slice(-2);
    const numInt = parseInt(digits, 10);
    const text = `Nomor antrean, Fisioterapi, ${numInt}. Silakan masuk ke Ruang seratus tiga.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }, 900);
}
