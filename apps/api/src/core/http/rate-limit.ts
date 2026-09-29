import type { Context, Env, MiddlewareHandler } from 'hono';

import type { RateLimiter } from '../security/rate-limiter';
import { fail } from './envelope';

/**
 * Hono middleware: 429 RATE_LIMITED with a Retry-After header once `limiter` refuses the key.
 * `keyFn` picks what to count (client IP, API key id).
 */
export function rateLimit<E extends Env>(
  limiter: RateLimiter,
  keyFn: (c: Context<E>) => string,
): MiddlewareHandler<E> {
  return async (c, next) => {
    const result = await limiter.limit(keyFn(c));
    if (!result.success) {
      c.header('Retry-After', String(result.retryAfterSeconds));
      return fail(c, 429, 'RATE_LIMITED', 'Too many requests. Try again later.');
    }
    await next();
  };
}

/**
 * Best-effort client IP: Cloudflare's `cf-connecting-ip`, else the first `x-forwarded-for` hop.
 * Requests with neither share one 'unknown' bucket.
 */
export function clientIp(c: Context): string {
  const cfIp = c.req.header('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}
