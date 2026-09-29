/*
 * Rate limiting behind one interface. Node dev and tests use the in-memory fixed window;
 * the Worker uses the Cloudflare `ratelimits` binding (counts are per location and approximate).
 */

export interface RateLimitResult {
  success: boolean;
  /** Seconds the caller should wait before retrying. 0 when `success` is true. */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

export interface MemoryRateLimiterOptions {
  limit: number;
  periodSeconds: number;
  now?: () => Date;
}

interface Window {
  startedAt: number;
  count: number;
}

/** Fixed window per key. Expired windows are pruned on each call so the map cannot grow unbounded. */
export function createMemoryRateLimiter(options: MemoryRateLimiterOptions): RateLimiter {
  const { limit, periodSeconds, now = () => new Date() } = options;
  const periodMs = periodSeconds * 1000;
  const windows = new Map<string, Window>();

  function prune(at: number): void {
    for (const [key, window] of windows) {
      if (at - window.startedAt >= periodMs) windows.delete(key);
    }
  }

  return {
    async limit(key: string): Promise<RateLimitResult> {
      const at = now().getTime();
      prune(at);
      const window = windows.get(key) ?? { startedAt: at, count: 0 };
      window.count += 1;
      windows.set(key, window);
      if (window.count <= limit) return { success: true, retryAfterSeconds: 0 };
      const remainingMs = window.startedAt + periodMs - at;
      return { success: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)) };
    },
  };
}

/** Shape of a Cloudflare Workers `ratelimits` binding: `env.X.limit({ key })`. */
export interface WorkersRateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Cloudflare only accepts these periods for the `ratelimits` binding. */
export const WORKERS_RATE_LIMIT_PERIODS = [10, 60] as const;
export type WorkersRateLimitPeriod = (typeof WORKERS_RATE_LIMIT_PERIODS)[number];

/**
 * Adapts the Workers binding. The binding does not say when the window resets,
 * so Retry-After is the configured period (the worst case).
 */
export function createWorkersRateLimiter(
  binding: WorkersRateLimitBinding,
  periodSeconds: WorkersRateLimitPeriod,
): RateLimiter {
  return {
    async limit(key: string): Promise<RateLimitResult> {
      const { success } = await binding.limit({ key });
      return { success, retryAfterSeconds: success ? 0 : periodSeconds };
    },
  };
}

/** Type guard for bindings read from an untyped Worker `env`. */
export function isWorkersRateLimitBinding(value: unknown): value is WorkersRateLimitBinding {
  return (
    typeof value === 'object' &&
    value !== null &&
    'limit' in value &&
    typeof (value as { limit: unknown }).limit === 'function'
  );
}
