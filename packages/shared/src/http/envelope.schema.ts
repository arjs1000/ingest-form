import { z } from 'zod';

/** Error body every API failure returns: `{ error: { code, message, details? } }`. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/** Wraps a payload schema in the success envelope: `{ data: T }`. */
export function apiSuccessSchema<T extends z.ZodType>(data: T) {
  return z.object({ data });
}
