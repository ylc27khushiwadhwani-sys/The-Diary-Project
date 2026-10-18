// Utilities for in-browser client-side PIN hashing and masked preview

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPasscode(passcode: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasscode(
  enteredPasscode: string,
  storedPayload: string
): Promise<boolean> {
  // storedPayload is stored as "salt$hash"
  if (!storedPayload.includes('$')) return false;
  const [salt, expectedHash] = storedPayload.split('$');
  const computedHash = await hashPasscode(enteredPasscode, salt);
  return computedHash === expectedHash;
}

export async function createStoredPasscodeHash(passcode: string): Promise<string> {
  const salt = generateSalt();
  const hash = await hashPasscode(passcode, salt);
  return `${salt}$${hash}`;
}

export function maskText(length: number = 120): string {
  const characters = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  return characters.repeat(Math.ceil(length / characters.length)).slice(0, length);
}
