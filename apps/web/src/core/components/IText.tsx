import { Slot } from '@radix-ui/react-slot';
import type { HTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type ITextSize = 'sm' | 'md' | 'lg';
export type ITextWeight = 'regular' | 'semibold';
export type ITextTone = 'default' | 'secondary' | 'error' | 'inverse';

export interface ITextProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Mirrors Radix Themes `Text`: span by default. */
  as?: 'span' | 'p' | 'div' | 'label';
  /** Style the single child instead of rendering an element (e.g. a link). */
  asChild?: boolean;
  size?: ITextSize;
  weight?: ITextWeight;
  tone?: ITextTone;
  truncate?: boolean;
  htmlFor?: string;
}

// Sizes are relative to the surface body size, so `md` is 16/19px on patient pages and 14px in admin.
const SIZE_CLASSES: Record<ITextSize, string> = {
  sm: 'text-[0.875em] leading-snug',
  md: 'text-[1em]',
  lg: 'text-[1.125em] leading-snug',
};

const TONE_CLASSES: Record<ITextTone, string> = {
  default: 'text-text',
  secondary: 'text-text-secondary',
  error: 'text-error',
  inverse: 'text-white',
};

export function IText({
  as: Tag = 'span',
  asChild = false,
  size = 'md',
  weight = 'regular',
  tone = 'default',
  truncate = false,
  className,
  ...props
}: ITextProps) {
  const Component = asChild ? Slot : Tag;
  return (
    <Component
      className={cn(
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        weight === 'semibold' ? 'font-semibold' : 'font-normal',
        truncate && 'truncate',
        className,
      )}
      {...props}
    />
  );
}
