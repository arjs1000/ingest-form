import { APPLICATION_REFERENCE_PATTERN, ingestPayloadSchema } from '@ingest-form/shared';
import type { IngestPayload } from '@ingest-form/shared';
import { z } from 'zod';

import { failure, issue, success } from '../pipeline/step.types';
import type { IngestStep, StepIssue } from '../pipeline/step.types';

/** Oldest age we accept. Anything above is almost certainly a typo in the year. */
export const MAX_AGE_YEARS = 120;

/** Walks a parsed JSON value along a Zod issue path. */
function valueAt(root: unknown, path: readonly PropertyKey[]): unknown {
  let current = root;
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

/** Stable issue code for a Zod issue, so admins and third parties can match on it. */
function codeFor(zodIssue: z.core.$ZodIssue, body: unknown): string {
  switch (zodIssue.code) {
    case 'invalid_type': {
      const value = valueAt(body, zodIssue.path);
      return value === undefined || value === null ? 'REQUIRED' : 'INVALID_TYPE';
    }
    // Required strings are trimmed then checked with min(1), so "  " lands here.
    case 'too_small':
      return 'REQUIRED';
    case 'invalid_format':
      return 'INVALID_FORMAT';
    default:
      return 'INVALID_VALUE';
  }
}

function toStepIssue(zodIssue: z.core.$ZodIssue, body: unknown): StepIssue {
  const path = zodIssue.path.map(String).join('.');
  const message = path === '' ? 'Body must be a JSON object' : zodIssue.message;
  return issue(path, codeFor(zodIssue, body), message);
}

/** Whole years between a YYYY-MM-DD date of birth and `today`, in UTC. */
function ageInYears(dateOfBirth: string, today: Date): number {
  const [year = 0, month = 1, day = 1] = dateOfBirth.split('-').map(Number);
  const hadBirthday =
    today.getUTCMonth() + 1 > month || (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  return today.getUTCFullYear() - year - (hadBirthday ? 0 : 1);
}

function dateOfBirthIssues(dateOfBirth: string, now: Date): StepIssue[] {
  const today = now.toISOString().slice(0, 10);
  // ISO dates compare correctly as strings.
  if (dateOfBirth > today) {
    return [issue('date_of_birth', 'DATE_OF_BIRTH_IN_FUTURE', 'date_of_birth cannot be in the future')];
  }
  if (ageInYears(dateOfBirth, now) > MAX_AGE_YEARS) {
    return [
      issue('date_of_birth', 'DATE_OF_BIRTH_IMPLAUSIBLE', `date_of_birth gives an age over ${MAX_AGE_YEARS} years`),
    ];
  }
  return [];
}

/** Raw body text → parsed, trimmed IngestPayload. Structural and date checks only. */
export const validateStep: IngestStep<string, IngestPayload> = {
  name: 'validate',
  input: z.string(),
  async run(rawBody, deps) {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return failure([issue('', 'INVALID_JSON', 'Body is not valid JSON')]);
    }

    const parsed = ingestPayloadSchema.safeParse(body);
    if (!parsed.success) return failure(parsed.error.issues.map((zodIssue) => toStepIssue(zodIssue, body)));

    const payload = parsed.data;
    const dateIssues = dateOfBirthIssues(payload.date_of_birth, deps.now());
    if (dateIssues.length > 0) return failure(dateIssues);

    const warnings: StepIssue[] = APPLICATION_REFERENCE_PATTERN.test(payload.application_reference)
      ? []
      : [
          issue(
            'application_reference',
            'APPLICATION_REFERENCE_FORMAT',
            'application_reference does not look like ABC-123456-2026',
            'warning',
          ),
        ];
    return success(payload, warnings);
  },
};
