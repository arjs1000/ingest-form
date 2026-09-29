import {
  notificationSettingsInputSchema,
  type NotificationSettingsDto,
  type NotificationSettingsInput,
} from '@ingest-form/shared';
import { z } from 'zod';

const EMAIL_MESSAGE = 'Enter an email address in the correct format, like name@example.com';

/** An empty field means "no email"; anything else must be an email address. */
const optionalEmail = z.union([z.literal(''), z.email({ error: EMAIL_MESSAGE })]);

/** Form values are strings; the API takes an address or null (notificationSettingsInputSchema). */
export const notificationSettingsSchema = z.object({
  successEmail: optionalEmail,
  failureEmail: optionalEmail,
});

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

/** Order of fields on the page; the error summary lists errors in this order. */
export const NOTIFICATION_SETTINGS_FIELD_ORDER = ['successEmail', 'failureEmail'] as const;

export function toNotificationSettingsValues(settings: NotificationSettingsDto): NotificationSettingsValues {
  return { successEmail: settings.successEmail ?? '', failureEmail: settings.failureEmail ?? '' };
}

export function toNotificationSettingsInput(values: NotificationSettingsValues): NotificationSettingsInput {
  return notificationSettingsInputSchema.parse({
    successEmail: values.successEmail.trim() || null,
    failureEmail: values.failureEmail.trim() || null,
  });
}
