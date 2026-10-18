import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  hashPasscode,
  createStoredPasscodeHash,
  verifyPasscode,
  maskText,
} from '../src/utils/crypto';

describe('Crypto & Passcode Locking', () => {
  it('generates a 32-character hexadecimal salt (16 bytes)', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    expect(salt1).toHaveLength(32);
    expect(salt2).toHaveLength(32);
    expect(salt1).toMatch(/^[0-9a-f]{32}$/);
    expect(salt1).not.toBe(salt2);
  });

  it('generates deterministic SHA-256 hashes for the same PIN and salt', async () => {
    const pin = '4829';
    const salt = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

    const hash1 = await hashPasscode(pin, salt);
    const hash2 = await hashPasscode(pin, salt);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different PINs with the same salt', async () => {
    const salt = generateSalt();
    const hash1 = await hashPasscode('1234', salt);
    const hash2 = await hashPasscode('5678', salt);

    expect(hash1).not.toBe(hash2);
  });

  it('correctly creates and verifies a stored passcode hash', async () => {
    const pin = '9912';
    const storedPayload = await createStoredPasscodeHash(pin);

    // Stored payload format is "salt$hash"
    expect(storedPayload).toContain('$');
    const [salt, hash] = storedPayload.split('$');
    expect(salt).toHaveLength(32);
    expect(hash).toHaveLength(64);

    // Correct PIN verifies true
    const isValid = await verifyPasscode(pin, storedPayload);
    expect(isValid).toBe(true);

    // Incorrect PIN verifies false
    const isInvalid = await verifyPasscode('0000', storedPayload);
    expect(isInvalid).toBe(false);
  });

  it('rejects corrupted or malformed stored hash payloads gracefully', async () => {
    const isValid = await verifyPasscode('1234', 'malformedpayloadwithoutsalt');
    expect(isValid).toBe(false);
  });

  it('masks text with bullet glyphs for preview obscuring', () => {
    const masked = maskText(60);
    expect(masked).toHaveLength(60);
    expect(masked.startsWith('•')).toBe(true);
  });
});
