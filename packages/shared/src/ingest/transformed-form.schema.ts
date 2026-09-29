import { z } from 'zod';

export const TRANSFORMED_GENDERS = ['male', 'female', 'prefer-not-to-say'] as const;

/**
 * TransformedFormSchema: the camelCase record the pipeline saves. `dateOfBirth` is an ISO date
 * string (YYYY-MM-DD) on the wire and in stored step outputs; the database column is a DATE.
 */
export const transformedFormSchema = z.object({
  sessionId: z.string(),
  applicationReference: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  gender: z.enum(TRANSFORMED_GENDERS),
  dateOfBirth: z.iso.date(),
  phoneNumber: z.string().optional(),
  mobileNumber: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressLine3: z.string().optional(),
  postcode: z.string(),
  country: z.string(),
  longitude: z.number(),
  latitude: z.number(),
});

export type TransformedForm = z.infer<typeof transformedFormSchema>;

/** A saved application as the admin API returns it. Optional fields are null, not missing. */
export const applicationDtoSchema = transformedFormSchema.extend({
  id: z.string(),
  submissionId: z.string(),
  phoneNumber: z.string().nullable(),
  addressLine3: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type ApplicationDto = z.infer<typeof applicationDtoSchema>;
