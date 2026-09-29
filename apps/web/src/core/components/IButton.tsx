import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/core/lib/cn';

export type IButtonVariant = 'primary' | 'secondary' | 'reverse' | 'warning' | 'ghost';

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IButtonVariant;
  fullWidth?: boolean;
  /** Render the single child (e.g. a router `Link`) with button styling instead of a `<button>`. */
  asChild?: boolean;
}

// Colours, edges and press depth come from surface variables (styles.css), so the same variant
// is an NHS button on patient pages and a flat dashboard button inside data-surface="admin".
const VARIANT_CLASSES: Record<IButtonVariant, string> = {
  primary: 'bg-(--button-primary) text-white visited:text-white hover:text-white shadow-(--edge-primary) hover:bg-(--button-primary-hover)',
  secondary: 'border-2 border-brand bg-surface text-brand visited:text-brand hover:text-brand shadow-(--edge-secondary) hover:bg-brand-tint',
  reverse: 'border border-border bg-surface text-text visited:text-text hover:text-text shadow-(--edge-neutral) hover:bg-page',
  warning: 'bg-error text-white visited:text-white hover:text-white shadow-(--edge-error) hover:bg-error-edge',
  ghost: 'bg-transparent text-text visited:text-text hover:text-text hover:bg-page',
};

export function IButton({ variant = 'primary', fullWidth = false, asChild = false, className, type, ...props }: IButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      // Native buttons default to "submit"; make that an explicit choice.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'relative mb-(--edge-space) inline-flex min-h-(--control-h) items-center justify-center gap-2',
        'rounded-(--control-radius) px-(--control-px) py-2 text-(length:--control-text) font-semibold leading-tight no-underline',
        'transition-colors active:translate-y-(--press-offset) active:shadow-none',
        'focus-visible:bg-focus focus-visible:text-text focus-visible:shadow-[0_4px_0_var(--color-text)] focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        // Each variant sets its own visited/hover text colour: links styled as buttons must not
        // turn purple or inherit the page colour once visited.
        '[&_svg]:size-[1.15em] [&_svg]:shrink-0',
        VARIANT_CLASSES[variant],
        fullWidth ? 'w-full' : 'w-full md:w-auto',
        className,
      )}
      {...props}
    />
  );
}
