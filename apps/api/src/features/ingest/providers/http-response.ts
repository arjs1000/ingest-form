/**
 * Result of a call to an external HTTP service. Providers never throw for expected
 * failures (not found, service down); they return `ok: false` with a stable code.
 */
export type HttpResponse<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: HttpResponseError };

export interface HttpResponseError {
  /** Stable SCREAMING_SNAKE code, e.g. POSTCODE_NOT_FOUND. */
  code: string;
  message: string;
  /** True when trying again later may succeed (network error, 5xx, rate limited). */
  retryable: boolean;
}
