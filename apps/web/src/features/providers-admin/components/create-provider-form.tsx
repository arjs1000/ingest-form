import { zodResolver } from '@hookform/resolvers/zod';
import { createProviderInputSchema, type CreateProviderInput } from '@ingest-form/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { IButton } from '@/core/components/IButton';
import { IErrorSummary, type IErrorSummaryItem } from '@/core/components/IErrorSummary';
import { IFormField } from '@/core/components/IFormField';
import { IFormSection } from '@/core/components/IFormSection';
import { IInput } from '@/core/components/IInput';
import { ApiRequestError } from '@/core/lib/api-client';
import { notify } from '@/core/lib/notify';

import { createProviderMutationOptions } from '../api/providers.mutations';
import { CONFLICT_STATUS } from '../constants';

const FIELD_ID = 'provider-name';

export function CreateProviderForm() {
  const queryClient = useQueryClient();
  const create = useMutation(createProviderMutationOptions(queryClient));
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, submitCount },
  } = useForm<CreateProviderInput>({
    resolver: zodResolver(createProviderInputSchema),
    defaultValues: { name: '' },
    // NHS pattern: focus goes to the error summary, whose link leads to the field.
    shouldFocusError: false,
  });

  const summary: IErrorSummaryItem[] = errors.name?.message ? [{ fieldId: FIELD_ID, message: errors.name.message }] : [];

  const onValid = (values: CreateProviderInput) =>
    create.mutate(values, {
      onSuccess: (provider) => {
        reset({ name: '' });
        notify.success('Provider created', { description: `${provider.name} can now be given an API key.` });
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.status === CONFLICT_STATUS) {
          setError('name', { message: 'A provider with this name already exists' });
          return;
        }
        notify.error('Could not create the provider', { description: error.message });
      },
    });

  return (
    <IFormSection title="Add a provider" description="A provider is a third party that sends forms to the ingest API.">
      <form noValidate onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
        {/* key remounts the summary on each failed submit so it takes focus again. */}
        {summary.length > 0 ? <IErrorSummary key={`${submitCount}-${errors.name?.message}`} errors={summary} /> : null}
        <IFormField id={FIELD_ID} label="Provider name" hint="For example, Acme Health Ltd" error={errors.name?.message}>
          {(field) => <IInput {...field} {...register('name')} autoComplete="organization" />}
        </IFormField>
        <div>
          <IButton type="submit" disabled={create.isPending}>
            <Plus aria-hidden="true" />
            {create.isPending ? 'Creating…' : 'Create provider'}
          </IButton>
        </div>
      </form>
    </IFormSection>
  );
}
