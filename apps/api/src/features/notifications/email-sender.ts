import { z } from 'zod';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Resend drops a repeat of the same key for 24 hours, so a retried send never duplicates an email. */
  idempotencyKey: string;
}

export interface EmailSender {
  /** Resolves with the provider's message id. Throws EmailSendError when the provider refuses. */
  send(message: EmailMessage): Promise<{ id: string }>;
}

/** Carries only the HTTP status: Resend's error text can echo the recipient address. */
export class EmailSendError extends Error {
  constructor(readonly status: number) {
    super(`Email provider answered HTTP ${status}`);
    this.name = 'EmailSendError';
  }
}

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;
/** Status used when no HTTP response arrived at all (network error, timeout, unreadable body). */
const NO_RESPONSE_STATUS = 0;

const resendSendResponseSchema = z.object({ id: z.string() });

export interface ResendEmailSenderOptions {
  apiKey: string;
  /** A sender on a domain verified in Resend, e.g. "Bookable <notifications@example.com>". */
  from: string;
  /** Injected in tests. Defaults to the global fetch, which exists on Node and Workers. */
  fetch?: typeof fetch;
}

/**
 * Sends through the Resend REST API (POST /emails). Plain fetch rather than the SDK, so it runs
 * unchanged on Node and Cloudflare Workers with no extra dependency.
 */
export function createResendEmailSender(options: ResendEmailSenderOptions): EmailSender {
  // Late-bound: Workers reject a detached `fetch` reference, and tests may stub the global.
  const doFetch: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  return {
    async send(message) {
      let response: Response;
      try {
        response = await doFetch(RESEND_EMAILS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': message.idempotencyKey,
          },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });
      } catch {
        throw new EmailSendError(NO_RESPONSE_STATUS);
      }

      if (!response.ok) throw new EmailSendError(response.status);
      const body = resendSendResponseSchema.safeParse(await response.json().catch(() => null));
      if (!body.success) throw new EmailSendError(NO_RESPONSE_STATUS);
      return { id: body.data.id };
    },
  };
}
