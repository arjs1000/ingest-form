import { buildDeps, createApp } from './app';
import { loadConfig } from './core/config/env';
import { isWorkersRateLimitBinding } from './core/security/rate-limiter';

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

// Cloudflare Workers entry. Bindings (vars + secrets) replace process.env.
// The app is built per request: Workers forbid reusing I/O objects (the Postgres TCP connection
// inside Prisma) across requests, and a shared client hangs on the second request.
// Rate-limit state lives in the bindings, not in the app, so rebuilding does not reset limits.
export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: WorkerExecutionContext): Promise<Response> {
    // String vars go through loadConfig; the `ratelimits` bindings (wrangler.jsonc) are objects.
    const { INGEST_KEY_LIMITER: keyLimiter, INGEST_IP_LIMITER: ipLimiter, INTAKE_IP_LIMITER: intakeLimiter } = env;
    const deps = buildDeps(loadConfig(env), {
      ingestKeyLimiter: isWorkersRateLimitBinding(keyLimiter) ? keyLimiter : undefined,
      ingestIpLimiter: isWorkersRateLimitBinding(ipLimiter) ? ipLimiter : undefined,
      intakeIpLimiter: isWorkersRateLimitBinding(intakeLimiter) ? intakeLimiter : undefined,
    });
    const response = await createApp(deps).fetch(request, env, ctx as never);
    if (deps.dispose) ctx.waitUntil(deps.dispose());
    return response;
  },
};
