import { RefreshCw } from 'lucide-react';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { IText } from '@/core/components/IText';

export interface LoadErrorProps {
  title: string;
  error: Error;
  onRetry: () => void;
}

/** A failed query: what failed, the API's reason, and a way to try again. */
export function LoadError({ title, error, onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-(--card-radius) border border-border bg-surface p-(--card-pad)">
      <div className="flex flex-wrap items-center gap-2">
        <IBadge tone="error">Error</IBadge>
        <IText weight="semibold">{title}</IText>
      </div>
      <IText as="p" tone="secondary">
        {error.message}
      </IText>
      <IButton variant="reverse" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Try again
      </IButton>
    </div>
  );
}
