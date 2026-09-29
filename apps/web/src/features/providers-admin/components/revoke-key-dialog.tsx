import type { ApiKeyDto } from '@ingest-form/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { useState } from 'react';

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
import { notify } from '@/core/lib/notify';

import { revokeApiKeyMutationOptions } from '../api/providers.mutations';

export function RevokeKeyDialog({ apiKey }: { apiKey: ApiKeyDto }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const revoke = useMutation(revokeApiKeyMutationOptions(queryClient));
  const name = `${apiKey.prefix}…`;

  const confirm = () =>
    revoke.mutate(apiKey.id, {
      onSuccess: () => {
        setOpen(false);
        notify.success('API key revoked', { description: `${name} no longer works.` });
      },
      onError: (error) => notify.error('Could not revoke the key', { description: error.message }),
    });

  return (
    <IDialog open={open} onOpenChange={setOpen}>
      <IDialogTrigger asChild>
        <IButton variant="ghost" className="w-auto text-error" aria-label={`Revoke key ${name}`}>
          <Ban aria-hidden="true" />
          Revoke
        </IButton>
      </IDialogTrigger>
      <IDialogContent>
        <IDialogTitle>Revoke key {name}?</IDialogTitle>
        <IDialogDescription>
          Requests using this key are refused straight away. This cannot be undone: the provider needs a new key.
        </IDialogDescription>
        <IDialogFooter>
          <IDialogClose asChild>
            <IButton variant="reverse">Cancel</IButton>
          </IDialogClose>
          <IButton variant="warning" onClick={confirm} disabled={revoke.isPending}>
            {revoke.isPending ? 'Revoking…' : 'Revoke key'}
          </IButton>
        </IDialogFooter>
      </IDialogContent>
    </IDialog>
  );
}
