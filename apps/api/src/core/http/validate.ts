import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { z } from 'zod';

import { ValidationError } from '../errors/app-error';

/**
 * Route-level Zod validation. Failures become a 400 in the standard error envelope.
 * Usage: `router.post('/', validate('json', schema), (c) => { const body = c.req.valid('json') })`
 */
export function validate<Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.map(String).join('.'),
        message: issue.message,
      }));
      throw new ValidationError(issues);
    }
  });
}
