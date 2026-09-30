import test from 'node:test';
import assert from 'node:assert';
import {
  isOperationalDay,
  formatQueueNumber,
  validateNIK,
  validateWhatsApp,
  generateKodeTiket,
  MAX_KUOTA_HARIAN
} from './queue-rules.js';

test('Kuata capacity is strictly MAX_KUOTA_HARIAN = 10', () => {
  assert.strictEqual(MAX_KUOTA_HARIAN, 10);
});

test('Patients up to 10 can be registered', () => {
  let activeList = [];
  for (let i = 1; i <= 10; i++) {
    assert.ok(activeList.length < MAX_KUOTA_HARIAN, `Patient ${i} should be allowed`);
    activeList.push({
      id: `antrean-${i}`,
      nomorAntrean: formatQueueNumber(activeList.length + 1),
      status: 'MENUNGGU'
    });
  }
  assert.strictEqual(activeList.length, 10);
  assert.strictEqual(activeList.length >= MAX_KUOTA_HARIAN, true);
  // 11th patient must be rejected
  const canAdd11 = activeList.length < MAX_KUOTA_HARIAN;
  assert.strictEqual(canAdd11, false);
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
