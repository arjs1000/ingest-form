import type { HTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type IHeadingLevel = 1 | 2 | 3 | 4;

export interface IHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level: renders h1-h4. */
  level: IHeadingLevel;
  /** Visual size when it must differ from the level (keeps the document outline correct). */
  size?: IHeadingLevel;
}

const SIZE_CLASSES: Record<IHeadingLevel, string> = {
  1: 'text-(length:--h1-size) leading-[1.18]',
  2: 'text-(length:--h2-size) leading-[1.22]',
  3: 'text-(length:--h3-size) leading-[1.28]',
  4: 'text-(length:--h4-size) leading-[1.35]',
};

export function IHeading({ level, size, className, ...props }: IHeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn('font-semibold text-text', SIZE_CLASSES[size ?? level], className)} {...props} />;
}
