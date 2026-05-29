import { randomBytes } from 'node:crypto';

// No ambiguous characters (no I, O, 0, 1).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A short, human-readable pickup code, e.g. "K7QF". */
export function generatePickupCode(length = 4): string {
  const bytes = randomBytes(length);
  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}
