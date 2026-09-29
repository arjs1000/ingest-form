import { z } from 'zod';

/**
 * Admin → General notification addresses (FEAT-003). One address each; null means "no email".
 * Shared by supplier (API) and patient (UI) submissions.
 */
export const notificationSettingsInputSchema = z.object({
  /** Receives one email per completed submission. */
  successEmail: z.email().nullable(),
  /** Receives one email per failed attempt. */
  failureEmail: z.email().nullable(),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsInputSchema>;

/** GET /api/admin/settings/notifications: the addresses plus whether Resend is set up (never the key). */
export const notificationSettingsDtoSchema = notificationSettingsInputSchema.extend({
  /** true when RESEND_API_KEY and RESEND_FROM_EMAIL are both set on the API. */
  emailConfigured: z.boolean(),
});

export type NotificationSettingsDto = z.infer<typeof notificationSettingsDtoSchema>;

/** Used until an admin first saves the addresses. */
export const EMPTY_NOTIFICATION_SETTINGS: NotificationSettingsInput = { successEmail: null, failureEmail: null };
