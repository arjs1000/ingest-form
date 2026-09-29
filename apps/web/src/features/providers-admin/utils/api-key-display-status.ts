import { API_KEY_EXPIRY_WARNING_DAYS, type ApiKeyDto } from '@ingest-form/shared';

import type { IBadgeTone } from '@/core/components/IBadge';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ApiKeyDisplayStatus {
  label: string;
  tone: IBadgeTone;
  /** False once a key is revoked or expired: nothing more can be done with it. */
  usable: boolean;
}

/**
 * What the admin sees for a key. Expiry is also checked against `now`, so a key the API still
 * calls "active" shows "Expired" once its date has passed.
 */
export function apiKeyDisplayStatus(key: ApiKeyDto, now: Date = new Date()): ApiKeyDisplayStatus {
  if (key.status === 'revoked') return { label: 'Revoked', tone: 'neutral', usable: false };

  const msLeft = new Date(key.expiresAt).getTime() - now.getTime();
  if (key.status === 'expired' || msLeft <= 0) return { label: 'Expired', tone: 'error', usable: false };

  const daysLeft = Math.ceil(msLeft / MS_PER_DAY);
  if (daysLeft <= API_KEY_EXPIRY_WARNING_DAYS) {
    return { label: `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`, tone: 'warning', usable: true };
  }
  return { label: 'Active', tone: 'success', usable: true };
}
