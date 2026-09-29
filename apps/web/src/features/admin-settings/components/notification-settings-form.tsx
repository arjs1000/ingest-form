import { zodResolver } from '@hookform/resolvers/zod';
import type { NotificationSettingsDto } from '@ingest-form/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, RotateCcw, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { IErrorSummary, type IErrorSummaryItem } from '@/core/components/IErrorSummary';
import { IFormField } from '@/core/components/IFormField';
import { IFormSection } from '@/core/components/IFormSection';
import { IInput } from '@/core/components/IInput';
import { ISkeleton } from '@/core/components/ISkeleton';
import { IText } from '@/core/components/IText';
import { notify } from '@/core/lib/notify';

import { saveNotificationSettingsMutationOptions } from '../api/notification-settings.mutations';
import { notificationSettingsQueryOptions } from '../api/notification-settings.queries';
import {
  NOTIFICATION_SETTINGS_FIELD_ORDER,
  notificationSettingsSchema,
  toNotificationSettingsInput,
  toNotificationSettingsValues,
  type NotificationSettingsValues,
} from '../schemas/notification-settings.schema';

/**
 * Success and failure email addresses (FEAT-003). Saved through /api/admin/settings/notifications;
 * the ingest pipeline reads them for every submission, from the API and the patient form alike.
 */
export function NotificationSettingsForm() {
  const settings = useQuery(notificationSettingsQueryOptions);

  if (settings.isPending) return <ISkeleton className="h-64 w-full" />;
  if (settings.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <IText as="p" weight="semibold" tone="error">
          Could not load the notification settings: {settings.error.message}
        </IText>
        <IButton variant="reverse" onClick={() => void settings.refetch()}>
          <RefreshCw aria-hidden="true" />
          Try again
        </IButton>
      </div>
    );
  }
  return <NotificationSettingsFields saved={settings.data} />;
}

function EmailStatus({ configured }: { configured: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IBadge tone={configured ? 'success' : 'warning'}>{configured ? 'Email on' : 'Email off'}</IBadge>
      <IText size="sm" tone="secondary">
        {configured
          ? 'Resend is configured on the API.'
          : 'Emails are not sent until RESEND_API_KEY and RESEND_FROM_EMAIL are set on the API. Addresses can be saved now.'}
      </IText>
    </div>
  );
}

function NotificationSettingsFields({ saved }: { saved: NotificationSettingsDto }) {
  const queryClient = useQueryClient();
  const save = useMutation(saveNotificationSettingsMutationOptions(queryClient));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount, isDirty },
  } = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: toNotificationSettingsValues(saved),
    // NHS pattern: focus goes to the error summary, whose links lead to each field.
    shouldFocusError: false,
  });

  const summary: IErrorSummaryItem[] = NOTIFICATION_SETTINGS_FIELD_ORDER.flatMap((field) => {
    const message = errors[field]?.message;
    return message ? [{ fieldId: field, message }] : [];
  });

  const onValid = async (values: NotificationSettingsValues) => {
    try {
      const stored = await save.mutateAsync(toNotificationSettingsInput(values));
      reset(toNotificationSettingsValues(stored));
      notify.success('Notification settings saved', { description: 'The next submission uses these addresses.' });
    } catch (error) {
      notify.error('Notification settings not saved', { description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onValid)} className="flex flex-col gap-6">
      {/* key remounts the summary on each failed submit so it takes focus again. */}
      {summary.length > 0 ? <IErrorSummary key={submitCount} errors={summary} /> : null}

      <IFormSection
        title="Notifications"
        description="One email per submission outcome. Emails hold the reference, status, failed step and issue codes, never patient details."
      >
        <EmailStatus configured={saved.emailConfigured} />
        <IFormField
          id="successEmail"
          label="Success email"
          hint="Gets an email when a submission completes. Leave empty for none."
          error={errors.successEmail?.message}
        >
          {(field) => (
            <IInput {...field} {...register('successEmail')} type="email" inputMode="email" autoComplete="email" spellCheck={false} />
          )}
        </IFormField>
        <IFormField
          id="failureEmail"
          label="Failure email"
          hint="Gets an email each time a submission fails a step, including after a re-run. Leave empty for none."
          error={errors.failureEmail?.message}
        >
          {(field) => (
            <IInput {...field} {...register('failureEmail')} type="email" inputMode="email" autoComplete="email" spellCheck={false} />
          )}
        </IFormField>
      </IFormSection>

      <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center">
        <IButton type="submit" disabled={save.isPending}>
          <Save aria-hidden="true" />
          Save notifications
        </IButton>
        <IButton variant="reverse" disabled={!isDirty} onClick={() => reset()}>
          <RotateCcw aria-hidden="true" />
          Reset
        </IButton>
      </div>
    </form>
  );
}
