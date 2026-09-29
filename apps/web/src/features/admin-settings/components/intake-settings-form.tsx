import { zodResolver } from '@hookform/resolvers/zod';
import type { IntakeSettingsDto } from '@ingest-form/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, RotateCcw, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { IButton } from '@/core/components/IButton';
import { IErrorSummary, type IErrorSummaryItem } from '@/core/components/IErrorSummary';
import { IFormSection } from '@/core/components/IFormSection';
import { IRadios } from '@/core/components/IRadios';
import { ISkeleton } from '@/core/components/ISkeleton';
import { ISwitch } from '@/core/components/ISwitch';
import { IText } from '@/core/components/IText';
import { notify } from '@/core/lib/notify';

import { saveIntakeSettingsMutationOptions } from '../api/intake-settings.mutations';
import { intakeSettingsQueryOptions } from '../api/intake-settings.queries';
import {
  INTAKE_SETTINGS_FIELD_ORDER,
  intakeSettingsSchema,
  MAX_FILE_SIZE_OPTIONS,
  toIntakeSettingsDto,
  toIntakeSettingsValues,
  type IntakeSettingsValues,
} from '../schemas/intake-settings.schema';

// The radio group's first option is the jump target for its error-summary link.
const FIELD_IDS: Record<(typeof INTAKE_SETTINGS_FIELD_ORDER)[number], string> = {
  maxFileSizeMb: `maxFileSizeMb-${MAX_FILE_SIZE_OPTIONS[0]}`,
};

const SIZE_OPTIONS = MAX_FILE_SIZE_OPTIONS.map((value) => ({ value, label: `${value} MB` }));

/**
 * Upload settings for the patient document step. Saved through /api/admin/settings/intake; the
 * extract endpoint enforces them and the patient flow shows them on its next visit.
 */
export function IntakeSettingsForm() {
  const settings = useQuery(intakeSettingsQueryOptions);

  if (settings.isPending) return <ISkeleton className="h-64 w-full" />;
  if (settings.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <IText as="p" weight="semibold" tone="error">
          Could not load the intake settings: {settings.error.message}
        </IText>
        <IButton variant="reverse" onClick={() => void settings.refetch()}>
          <RefreshCw aria-hidden="true" />
          Try again
        </IButton>
      </div>
    );
  }
  return <IntakeSettingsFields saved={settings.data} />;
}

function IntakeSettingsFields({ saved }: { saved: IntakeSettingsDto }) {
  const queryClient = useQueryClient();
  const save = useMutation(saveIntakeSettingsMutationOptions(queryClient));
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, submitCount, isDirty },
  } = useForm<IntakeSettingsValues>({
    resolver: zodResolver(intakeSettingsSchema),
    defaultValues: toIntakeSettingsValues(saved),
    // NHS pattern: focus goes to the error summary, whose links lead to each field.
    shouldFocusError: false,
  });

  const summary: IErrorSummaryItem[] = INTAKE_SETTINGS_FIELD_ORDER.flatMap((field) => {
    const message = errors[field]?.message;
    return message ? [{ fieldId: FIELD_IDS[field], message }] : [];
  });

  const onValid = async (values: IntakeSettingsValues) => {
    try {
      const stored = await save.mutateAsync(toIntakeSettingsDto(values));
      reset(toIntakeSettingsValues(stored));
      notify.success('Settings saved', { description: 'Patients get the new limits on their next upload.' });
    } catch (error) {
      notify.error('Settings not saved', { description: error instanceof Error ? error.message : undefined });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onValid)} className="flex flex-col gap-6">
      {/* key remounts the summary on each failed submit so it takes focus again. */}
      {summary.length > 0 ? <IErrorSummary key={submitCount} errors={summary} /> : null}

      <IFormSection title="Uploads" description="Limits for patient document uploads.">
        <Controller
          control={control}
          name="acceptPhotos"
          render={({ field }) => (
            <ISwitch
              id="acceptPhotos"
              label="Accept photos"
              hint="Let patients upload JPG and PNG photos as well as PDFs."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <IRadios
          name="maxFileSizeMb"
          legend="Maximum file size"
          inline
          error={errors.maxFileSizeMb?.message}
          options={SIZE_OPTIONS}
          inputProps={register('maxFileSizeMb')}
        />
      </IFormSection>

      <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center">
        <IButton type="submit" disabled={save.isPending}>
          <Save aria-hidden="true" />
          Save settings
        </IButton>
        <IButton variant="reverse" disabled={!isDirty} onClick={() => reset()}>
          <RotateCcw aria-hidden="true" />
          Reset
        </IButton>
      </div>
    </form>
  );
}
