import type { HTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

/** 960px width container with 16px (mobile) / 32px (md+) gutters. Every page body sits in one. */
export function IContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-page px-4 md:px-8', className)} {...props} />;
}
