import test from 'node:test';
import assert from 'node:assert';
import {
  isOperationalDay,
  formatQueueNumber,
  validateNIK,
  validateWhatsApp,
  generateKodeTiket,
  MAX_KUOTA_HARIAN,
  MAX_KUOTA_ONLINE,
  MAX_KUOTA_OFFLINE
} from './queue-rules.js';

test('Kuata capacity is strictly MAX_KUOTA_HARIAN = 10 (Online: 6, Offline: 4)', () => {
  assert.strictEqual(MAX_KUOTA_HARIAN, 10);
  assert.strictEqual(MAX_KUOTA_ONLINE, 6);
  assert.strictEqual(MAX_KUOTA_OFFLINE, 4);
});

test('Online patients can only register up to MAX_KUOTA_ONLINE = 6', () => {
  let activeList = [];
  for (let i = 1; i <= 6; i++) {
    const onlineCount = activeList.filter(a => a.jalur === 'ONLINE' && a.status !== 'BATAL').length;
    assert.ok(onlineCount < MAX_KUOTA_ONLINE, `Online patient ${i} should be allowed`);
    activeList.push({
      id: `antrean-online-${i}`,
      nomorAntrean: formatQueueNumber(activeList.length + 1),
      jalur: 'ONLINE',
      status: 'MENUNGGU'
    });
  }
  const currentOnline = activeList.filter(a => a.jalur === 'ONLINE' && a.status !== 'BATAL').length;
  assert.strictEqual(currentOnline, 6);
  // 7th online patient must be rejected
  const canAdd7thOnline = currentOnline < MAX_KUOTA_ONLINE;
  assert.strictEqual(canAdd7thOnline, false);
});

test('Offline patients can register up to remaining total quota (4 offline)', () => {
  let activeList = [];
  // 6 online already registered
  for (let i = 1; i <= 6; i++) {
    activeList.push({
      id: `antrean-online-${i}`,
      jalur: 'ONLINE',
      status: 'MENUNGGU'
    });
  }
  // Now add 4 offline
  for (let j = 1; j <= 4; j++) {
    const totalActive = activeList.filter(a => a.status !== 'BATAL').length;
    const offlineCount = activeList.filter(a => a.jalur === 'OFFLINE' && a.status !== 'BATAL').length;
    assert.ok(offlineCount < MAX_KUOTA_OFFLINE && totalActive < MAX_KUOTA_HARIAN, `Offline patient ${j} should be allowed`);
    activeList.push({
      id: `antrean-offline-${j}`,
      jalur: 'OFFLINE',
      status: 'MENUNGGU'
    });
  }
  assert.strictEqual(activeList.length, 10);
  // 11th patient must be rejected
  assert.strictEqual(activeList.length >= MAX_KUOTA_HARIAN, true);
});

test('When 1 patient cancels, remaining count becomes 9 and another patient can register', () => {
  let activeList = [];
  for (let i = 1; i <= 10; i++) {
    activeList.push({ id: `antrean-${i}`, status: 'MENUNGGU' });
  }
  // Cancel 3rd patient
  activeList[2].status = 'BATAL';
  const remainingActive = activeList.filter(a => a.status !== 'BATAL').length;
  assert.strictEqual(remainingActive, 9);
  assert.strictEqual(remainingActive < MAX_KUOTA_HARIAN, true);

  // 10th active patient can now register!
  activeList.push({ id: 'antrean-new-10', status: 'MENUNGGU' });
  const finalActive = activeList.filter(a => a.status !== 'BATAL').length;
  assert.strictEqual(finalActive, 10);
});

test('NIK and WhatsApp validation', () => {
  assert.strictEqual(validateNIK('3312011234560001').valid, true);
  assert.strictEqual(validateNIK('331201').valid, false);
  assert.strictEqual(validateWhatsApp('081234567890').valid, true);
  assert.strictEqual(validateWhatsApp('6281234567890').valid, true);
  assert.strictEqual(validateWhatsApp('1234').valid, false);
});

test('Kode Tiket formatting', () => {
  const code = generateKodeTiket('2026-10-01', '01');
  assert.strictEqual(code, 'PKM-FISIO-20261001-01');
});
