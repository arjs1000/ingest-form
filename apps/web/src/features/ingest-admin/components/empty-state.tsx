import type { LucideIcon } from 'lucide-react';

import { IText } from '@/core/components/IText';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-(--card-radius) border border-dashed border-border-strong bg-surface p-8 text-center">
      <Icon aria-hidden="true" className="size-6 text-text-secondary" />
      <IText as="p" weight="semibold">
        {title}
      </IText>
      <IText as="p" tone="secondary" className="max-w-md">
        {description}
      </IText>
    </div>
  );
}
