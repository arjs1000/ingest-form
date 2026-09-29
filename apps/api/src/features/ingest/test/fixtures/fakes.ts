import { EmailSendError, type EmailMessage, type EmailSender } from '../../../notifications/email-sender';
import type { HttpResponse } from '../../providers/http-response';
import type { Coordinates, PostcodeLookup } from '../../providers/postcode-lookup.types';
import { KNOWN_POSTCODES } from './ingest-payloads';

export interface FakePostcodeLookup {
  lookup: PostcodeLookup;
  /** Set to true to simulate postcodes.io being down. */
  down: boolean;
}

/** A stand-in for postcodes.io that answers from KNOWN_POSTCODES. */
export function createFakePostcodeLookup(): FakePostcodeLookup {
  const fake: FakePostcodeLookup = {
    down: false,
    lookup: async (postcode: string): Promise<HttpResponse<Coordinates>> => {
      if (fake.down) {
        return {
          ok: false,
          status: 503,
          error: { code: 'GEOCODER_UNAVAILABLE', message: 'The postcode lookup service is unavailable', retryable: true },
        };
      }
      const coordinates = KNOWN_POSTCODES[postcode];
      if (!coordinates) {
        return { ok: false, status: 404, error: { code: 'POSTCODE_NOT_FOUND', message: 'Postcode not found', retryable: false } };
      }
      return { ok: true, status: 200, data: coordinates };
    },
  };
  return fake;
}

export interface FakeEmailSender extends EmailSender {
  /** Every email sent, oldest first. */
  sent: EmailMessage[];
  /** Set to true to simulate Resend refusing the request. */
  failing: boolean;
}

/** A stand-in for Resend that records emails instead of sending them. */
export function createFakeEmailSender(): FakeEmailSender {
  const fake: FakeEmailSender = {
    sent: [],
    failing: false,
    async send(message) {
      if (fake.failing) throw new EmailSendError(500);
      fake.sent.push(message);
      return { id: `email-${fake.sent.length}` };
    },
  };
  return fake;
}
