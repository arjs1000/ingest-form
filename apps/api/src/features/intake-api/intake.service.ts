import type { IntakeResultDto } from '@ingest-form/shared';

import type { PipelineRunner } from '../ingest/pipeline/pipeline.types';
import type { SubmissionRepository } from '../ingest/repositories/ingest.repositories';
import { UI_REFERENCE_PREFIX } from './intake-api.constants';

export interface IntakeService {
  /** Stores the patient's form (source `ui`) and runs the ingest pipeline on it. */
  submit(rawBody: string): Promise<IntakeResultDto>;
}

export interface IntakeServiceDeps {
  submissions: Pick<SubmissionRepository, 'create'>;
  pipeline: Pick<PipelineRunner, 'run'>;
  /** Supplies the year in generated references. */
  now: () => Date;
}

interface PreparedBody {
  rawBody: string;
  applicationReference: string | null;
}

const REFERENCE_DIGITS = 1_000_000;

/** `UIF-<6 random digits>-<year>`, matching APPLICATION_REFERENCE_PATTERN. */
function generateReference(now: Date): string {
  const [random = 0] = crypto.getRandomValues(new Uint32Array(1));
  const digits = String(random % REFERENCE_DIGITS).padStart(6, '0');
  return `${UI_REFERENCE_PREFIX}-${digits}-${now.getUTCFullYear()}`;
}

function parseObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * None of the paper forms carries a reference, so one is generated when it is missing or blank.
 * Anything that is not a JSON object is stored unchanged and fails visibly at the validate step.
 */
function withReference(text: string, now: Date): PreparedBody {
  const body = parseObject(text);
  if (!body) return { rawBody: text, applicationReference: null };

  const sent = body.application_reference;
  if (typeof sent === 'string' && sent.trim() !== '') return { rawBody: text, applicationReference: sent.trim() };
  if (sent !== undefined && sent !== null && typeof sent !== 'string') {
    return { rawBody: text, applicationReference: null };
  }

  const applicationReference = generateReference(now);
  return { rawBody: JSON.stringify({ ...body, application_reference: applicationReference }), applicationReference };
}

export function createIntakeService(deps: IntakeServiceDeps): IntakeService {
  return {
    async submit(text) {
      const { rawBody, applicationReference } = withReference(text, deps.now());
      const submission = await deps.submissions.create({ source: 'ui', providerId: null, apiKeyId: null, rawBody });
      const outcome = await deps.pipeline.run(submission.id);
      return { ...outcome, applicationReference };
    },
  };
}
