import { z } from 'zod';

import { apiSuccessSchema } from '../http/envelope.schema';

export const healthStatusSchema = z.object({
  status: z.literal('ok'),
});

export const healthResponseSchema = apiSuccessSchema(healthStatusSchema);

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
