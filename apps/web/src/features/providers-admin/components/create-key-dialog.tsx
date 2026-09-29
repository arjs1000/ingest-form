import { zodResolver } from '@hookform/resolvers/zod';
import {
  API_KEY_TTL_DAYS,
  createApiKeyInputSchema,
  type CreateApiKeyInput,
  type CreatedApiKeyDto,
} from '@ingest-form/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { IButton } from '@/core/components/IButton';
import {
  IDialog,
  IDialogClose,
  IDialogContent,
  IDialogDescription,
  IDialogFooter,
  IDialogTitle,
  IDialogTrigger,
} from '@/core/components/IDialog';
import { IFormField } from '@/core/components/IFormField';
import { IInput } from '@/core/components/IInput';
import { notify } from '@/core/lib/notify';

import { createApiKeyMutationOptions } from '../api/providers.mutations';
import { CreatedKeyPanel } from './created-key-panel';

export interface CreateKeyDialogProps {
  providerId: string;
  providerName: string;
  /** Rotating is creating another key while one is still usable; the copy explains the overlap. */
  intent: 'create' | 'rotate';
}

const COPY = {
  create: {
    trigger: 'Create key',
    title: 'Create an API key',
    description: `The provider sends this key as a Bearer token. It is valid for ${API_KEY_TTL_DAYS} days.`,
  },
  rotate: {
    trigger: 'Rotate key',
    title: 'Rotate the API key',
    description:
      `This creates a new key, valid for ${API_KEY_TTL_DAYS} days. The old key keeps working until it expires or you revoke it, so the provider can switch over without downtime.`,
  },
} as const;

export function CreateKeyDialog({ providerId, providerName, intent }: CreateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  // Held only while the dialog is open; closing forgets the key for good.
  const [created, setCreated] = useState<CreatedApiKeyDto | null>(null);
  const queryClient = useQueryClient();
  const createKey = useMutation(createApiKeyMutationOptions(queryClient));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyInput>({ resolver: zodResolver(createApiKeyInputSchema), defaultValues: { label: '' } });
  const copy = COPY[intent];
  const fieldId = `key-label-${providerId}`;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setCreated(null);
      reset({ label: '' });
      createKey.reset();
    }
  };

  const onValid = ({ label }: CreateApiKeyInput) =>
    createKey.mutate(
      { providerId, input: label ? { label } : {} },
      {
        onSuccess: (result) => {
          setCreated(result);
          notify.success('API key created', { description: `For ${providerName}. Copy it before closing.` });
        },
        onError: (error) => notify.error('Could not create the key', { description: error.message }),
      },
    );

  const TriggerIcon = intent === 'rotate' ? RotateCw : KeyRound;

  return (
    <IDialog open={open} onOpenChange={onOpenChange}>
      <IDialogTrigger asChild>
        <IButton variant={intent === 'rotate' ? 'reverse' : 'primary'} aria-label={`${copy.trigger} for ${providerName}`}>
          <TriggerIcon aria-hidden="true" />
          {copy.trigger}
        </IButton>
      </IDialogTrigger>
      <IDialogContent
        // Once the key is on screen, only the explicit Done button closes the dialog.
        onInteractOutside={(event) => {
          if (created) event.preventDefault();
        }}
      >
        {created ? (
          <>
            <IDialogTitle>Copy the new key for {providerName}</IDialogTitle>
            <IDialogDescription>Store it in the provider&apos;s secret manager. We keep only a hash.</IDialogDescription>
            <CreatedKeyPanel created={created} />
            <IDialogFooter>
              <IDialogClose asChild>
                <IButton>I have copied the key</IButton>
              </IDialogClose>
            </IDialogFooter>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
            <IDialogTitle>
              {copy.title} for {providerName}
            </IDialogTitle>
            <IDialogDescription>{copy.description}</IDialogDescription>
            <IFormField
              id={fieldId}
              label="Label (optional)"
              hint="Helps you tell keys apart, for example Production"
              error={errors.label?.message}
            >
              {(field) => <IInput {...field} {...register('label')} autoComplete="off" />}
            </IFormField>
            <IDialogFooter>
              <IDialogClose asChild>
                <IButton variant="reverse">Cancel</IButton>
              </IDialogClose>
              <IButton type="submit" disabled={createKey.isPending}>
                <KeyRound aria-hidden="true" />
                {createKey.isPending ? 'Creating…' : 'Create key'}
              </IButton>
            </IDialogFooter>
          </form>
        )}
      </IDialogContent>
    </IDialog>
  );
}
