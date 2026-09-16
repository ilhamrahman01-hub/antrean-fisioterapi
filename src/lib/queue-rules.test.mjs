import test from 'node:test';
import assert from 'node:assert';
import {
  isOperationalDay,
  formatQueueNumber,
  parseSequence,
  getNextSequence,
  validateNIK,
  validateWhatsApp,
  maskNIK,
  generateKodeTiket,
  MAX_KUOTA_HARIAN
} from './queue-rules.js';

test('isOperationalDay returns true for Senin s/d Kamis, false for Jumat-Minggu', () => {
  // 2026-09-14 is Monday (Senin) -> true
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 14)), true);
  // 2026-09-15 is Tuesday (Selasa) -> true
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 15)), true);
  // 2026-09-16 is Wednesday (Rabu) -> true
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 16)), true);
  // 2026-09-17 is Thursday (Kamis) -> true
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 17)), true);
  // 2026-09-18 is Friday (Jumat) -> false
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 18)), false);
  // 2026-09-19 is Saturday (Sabtu) -> false
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 19)), false);
  // 2026-09-20 is Sunday (Minggu) -> false
  assert.strictEqual(isOperationalDay(new Date(2026, 8, 20)), false);
});

test('formatQueueNumber formats 1 to 01 and 10 to 10', () => {
  assert.strictEqual(formatQueueNumber(1), '01');
  assert.strictEqual(formatQueueNumber(6), '06');
  assert.strictEqual(formatQueueNumber(10), '10');
});

test('parseSequence accepts new and legacy formats', () => {
  assert.strictEqual(parseSequence('01'), 1);
  assert.strictEqual(parseSequence('10'), 10);
  assert.strictEqual(parseSequence('FISIO-01'), 1);
  assert.strictEqual(parseSequence('FISIO-10'), 10);
});

test('getNextSequence is monotonic: cancelled slots are not reused', () => {
  // 01 issued then cancelled, 02-03 active -> next is 04, never 01 again
  assert.strictEqual(getNextSequence([1, 2, 3]), 4);
  assert.strictEqual(getNextSequence([]), 1);
  assert.strictEqual(getNextSequence([1, 3]), 4);
});

test('validateNIK validates exact 16 numeric digits', () => {
  assert.strictEqual(validateNIK('3312011234560001').valid, true);
  assert.strictEqual(validateNIK('33120112345').valid, false); // 11 digits
  assert.strictEqual(validateNIK('331201123456000A').valid, false); // alphanumeric
  assert.strictEqual(validateNIK('').valid, false);
});

test('validateWhatsApp validates indonesian mobile number', () => {
  assert.strictEqual(validateWhatsApp('081234567890').valid, true);
  assert.strictEqual(validateWhatsApp('6281234567890').valid, true);
  assert.strictEqual(validateWhatsApp('021234567').valid, false); // landline
});

test('maskNIK masks 6 middle digits correctly', () => {
  assert.strictEqual(maskNIK('3312011234560001'), '331201******0001');
});

test('generateKodeTiket creates formatted ticket code', () => {
  assert.strictEqual(generateKodeTiket('2024-11-06', '06'), 'PKM-FISIO-20241106-06');
  assert.strictEqual(generateKodeTiket('2024-11-06', 'FISIO-06'), 'PKM-FISIO-20241106-06');
});
