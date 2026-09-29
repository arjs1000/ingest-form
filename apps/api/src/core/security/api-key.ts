import { API_KEY_TTL_DAYS, type ApiKeyStatus } from '@ingest-form/shared';

/*
 * Ingest API keys. Web Crypto only (crypto.getRandomValues, crypto.subtle), so the same code
 * runs on Node 22 and Cloudflare Workers. Only the SHA-256 hash and a display prefix are stored.
 */

export const API_KEY_PREFIX = 'ifk_';
export const API_KEY_RANDOM_LENGTH = 32;
export const API_KEY_DISPLAY_PREFIX_LENGTH = 12;

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/** Largest multiple of 62 that fits in a byte. Bytes at or above it are rejected to avoid modulo bias. */
const UNBIASED_BYTE_LIMIT = Math.floor(256 / BASE62.length) * BASE62.length;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface GeneratedApiKey {
  /** The full secret. Shown to the admin once, never stored. */
  key: string;
  /** First characters of the key, safe to store and display. */
  prefix: string;
  /** SHA-256 hex of the full key. */
  hash: string;
}

function randomBase62(length: number): string {
  let out = '';
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte >= UNBIASED_BYTE_LIMIT) continue;
      out += BASE62[byte % BASE62.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export async function hashApiKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateApiKey(): Promise<GeneratedApiKey> {
  const key = `${API_KEY_PREFIX}${randomBase62(API_KEY_RANDOM_LENGTH)}`;
  return { key, prefix: key.slice(0, API_KEY_DISPLAY_PREFIX_LENGTH), hash: await hashApiKey(key) };
}

/** When a key created at `createdAt` stops working. */
export function apiKeyExpiry(createdAt: Date): Date {
  return new Date(createdAt.getTime() + API_KEY_TTL_DAYS * MS_PER_DAY);
}

interface KeyValidity {
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Revocation wins over expiry, so an admin sees why a key was switched off. */
export function apiKeyStatus(key: KeyValidity, now: Date): ApiKeyStatus {
  if (key.revokedAt) return 'revoked';
  if (key.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}
