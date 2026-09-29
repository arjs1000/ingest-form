import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export type IListVariant = 'bullet' | 'number' | 'plain';

export interface IListProps extends HTMLAttributes<HTMLElement> {
  variant?: IListVariant;
  items: ReactNode[];
}

const VARIANT_CLASSES: Record<IListVariant, string> = {
  bullet: 'list-disc pl-6',
  number: 'list-decimal pl-6',
  plain: 'list-none',
};

export function IList({ variant = 'bullet', items, className, ...props }: IListProps) {
  const Tag = variant === 'number' ? 'ol' : 'ul';
  return (
    <Tag className={cn('flex flex-col gap-2 marker:text-text', VARIANT_CLASSES[variant], className)} {...props}>
      {items.map((item, index) => (
        // Items are static content; index keys are stable here.
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}
